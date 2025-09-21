import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a test proof using the compiled circuit
 * This script demonstrates how to generate a real ZK proof
 */

const CIRCUIT_NAME = 'login_auth';
const BUILD_DIR = 'build';

async function generateProof() {
  console.log('🧪 Generating test proof...');
  
  try {
    // Check if circuit files exist
    const circuitFiles = [
      `${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey`,
      `${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm`,
      `${BUILD_DIR}/verification_key.json`
    ];
    
    for (const file of circuitFiles) {
      if (!fs.existsSync(file)) {
        console.error(`❌ Missing required file: ${file}`);
        console.log('Please run: npm run circuit:setup-full');
        process.exit(1);
      }
    }

    // Create test input
    const testInput = {
      password: "12345678901234567890123456789012", // 32 character test password
      storedHash: "123456789"
    };
    
    console.log('📝 Creating test input...');
    fs.writeFileSync(`${BUILD_DIR}/input.json`, JSON.stringify(testInput, null, 2));
    console.log('✅ Test input created');
    
    // Generate witness
    console.log('🔍 Generating witness...');
    execSync(`node ${BUILD_DIR}/${CIRCUIT_NAME}_js/generate_witness.js ${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm ${BUILD_DIR}/input.json ${BUILD_DIR}/witness.wtns`, {
      stdio: 'inherit'
    });
    console.log('✅ Witness generated');
    
    // Generate proof
    console.log('🔐 Generating ZK proof...');
    execSync(`snarkjs g16p ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey ${BUILD_DIR}/witness.wtns ${BUILD_DIR}/proof.json ${BUILD_DIR}/public.json`, {
      stdio: 'inherit'
    });
    console.log('✅ ZK proof generated');
    
    // Verify proof
    console.log('✅ Verifying proof...');
    execSync(`snarkjs g16v ${BUILD_DIR}/verification_key.json ${BUILD_DIR}/public.json ${BUILD_DIR}/proof.json`, {
      stdio: 'inherit'
    });
    console.log('✅ Proof verified successfully');
    
    // Display proof details
    const proof = JSON.parse(fs.readFileSync(`${BUILD_DIR}/proof.json`, 'utf8'));
    const publicSignals = JSON.parse(fs.readFileSync(`${BUILD_DIR}/public.json`, 'utf8'));
    
    console.log('\n📊 Proof Details:');
    console.log(`- Public signals: ${publicSignals.length}`);
    console.log(`- Proof A: ${proof.pi_a[0].slice(0, 20)}...`);
    console.log(`- Proof B: ${proof.pi_b[0][0].slice(0, 20)}...`);
    console.log(`- Proof C: ${proof.pi_c[0].slice(0, 20)}...`);
    
    console.log('\n🎉 Proof generation completed successfully!');
    console.log('\n📁 Generated files:');
    console.log(`- ${BUILD_DIR}/input.json (Test input)`);
    console.log(`- ${BUILD_DIR}/witness.wtns (Witness)`);
    console.log(`- ${BUILD_DIR}/proof.json (ZK Proof)`);
    console.log(`- ${BUILD_DIR}/public.json (Public signals)`);

  } catch (error) {
    console.error('❌ Proof generation failed:', error);
    process.exit(1);
  }
}

// Run the proof generation
generateProof().catch(console.error);
