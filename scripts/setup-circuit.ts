import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup script for the ZK circuit
 * This script handles the complete circuit setup process including:
 * 1. Compiling the circuit
 * 2. Setting up the trusted setup ceremony
 * 3. Generating the final proving key
 * 4. Exporting the verifier contract
 */

const CIRCUIT_NAME = 'login_auth';
const BUILD_DIR = 'build';
const CIRCUITS_DIR = 'circuits';

async function setupCircuit() {
  console.log('🔧 Starting circuit setup process...');
  
  try {
    // Step 1: Create build directory
    console.log('📁 Creating build directory...');
    if (!fs.existsSync(BUILD_DIR)) {
      fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    // Step 2: Compile the circuit
    console.log('⚙️  Compiling circuit...');
    try {
      execSync(`circom ${CIRCUITS_DIR}/${CIRCUIT_NAME}.circom --r1cs --wasm --sym --c --output ${BUILD_DIR}`, {
        stdio: 'inherit'
      });
      console.log('✅ Circuit compiled successfully');
    } catch (error) {
      console.error('❌ Circuit compilation failed:', error);
      throw error;
    }

    // Step 3: Check if we have the powers of tau file
    const powersOfTauFile = 'powersOfTau15_final.ptau';
    if (!fs.existsSync(powersOfTauFile)) {
      console.log('📥 Downloading powers of tau file...');
      try {
        execSync(`wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau15_final.ptau`, {
          stdio: 'inherit'
        });
        console.log('✅ Powers of tau file downloaded');
      } catch (error) {
        console.error('❌ Failed to download powers of tau file:', error);
        console.log('Please download it manually from: https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau15_final.ptau');
        throw error;
      }
    }

    // Step 4: Generate initial zkey
    console.log('🔑 Generating initial zkey...');
    try {
      execSync(`snarkjs g16s ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs powersOfTau15_final.ptau ${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey`, {
        stdio: 'inherit'
      });
      console.log('✅ Initial zkey generated');
    } catch (error) {
      console.error('❌ Initial zkey generation failed:', error);
      throw error;
    }

    // Step 5: Contribute to the ceremony
    console.log('🎭 Contributing to the ceremony...');
    try {
      execSync(`snarkjs zkc ${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey ${BUILD_DIR}/${CIRCUIT_NAME}_0001.zkey`, {
        stdio: 'inherit',
        input: 'Contributor 1\n'
      });
      console.log('✅ Ceremony contribution completed');
    } catch (error) {
      console.error('❌ Ceremony contribution failed:', error);
      throw error;
    }

    // Step 6: Generate final zkey
    console.log('🏁 Generating final zkey...');
    try {
      execSync(`snarkjs zkb ${BUILD_DIR}/${CIRCUIT_NAME}_0001.zkey ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10`, {
        stdio: 'inherit'
      });
      console.log('✅ Final zkey generated');
    } catch (error) {
      console.error('❌ Final zkey generation failed:', error);
      throw error;
    }

    // Step 7: Export verification key
    console.log('🔍 Exporting verification key...');
    try {
      execSync(`snarkjs zkev ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey ${BUILD_DIR}/verification_key.json`, {
        stdio: 'inherit'
      });
      console.log('✅ Verification key exported');
    } catch (error) {
      console.error('❌ Verification key export failed:', error);
      throw error;
    }

    // Step 8: Export verifier contract
    console.log('📄 Exporting verifier contract...');
    try {
      execSync(`snarkjs zkesv ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey contracts/Verifier.sol`, {
        stdio: 'inherit'
      });
      console.log('✅ Verifier contract exported');
    } catch (error) {
      console.error('❌ Verifier contract export failed:', error);
      throw error;
    }

    // Step 9: Generate a test proof
    console.log('🧪 Generating test proof...');
    try {
      // Create test input
      const testInput = {
        password: "12345678901234567890123456789012", // 32 character test password
        storedHash: "123456789"
      };
      
      fs.writeFileSync(`${BUILD_DIR}/input.json`, JSON.stringify(testInput, null, 2));
      
      // Generate witness
      execSync(`node ${BUILD_DIR}/${CIRCUIT_NAME}_js/generate_witness.js ${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm ${BUILD_DIR}/input.json ${BUILD_DIR}/witness.wtns`, {
        stdio: 'inherit'
      });
      
      // Generate proof
      execSync(`snarkjs g16p ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey ${BUILD_DIR}/witness.wtns ${BUILD_DIR}/proof.json ${BUILD_DIR}/public.json`, {
        stdio: 'inherit'
      });
      
      // Verify proof
      execSync(`snarkjs g16v ${BUILD_DIR}/verification_key.json ${BUILD_DIR}/public.json ${BUILD_DIR}/proof.json`, {
        stdio: 'inherit'
      });
      
      console.log('✅ Test proof generated and verified');
    } catch (error) {
      console.error('❌ Test proof generation failed:', error);
      throw error;
    }

    // Step 10: Copy files to frontend
    console.log('📁 Copying files to frontend...');
    const frontendPublicDir = path.join('frontend', 'public', 'circuits');
    if (!fs.existsSync(frontendPublicDir)) {
      fs.mkdirSync(frontendPublicDir, { recursive: true });
    }

    const filesToCopy = [
      `${CIRCUIT_NAME}.wasm`,
      `${CIRCUIT_NAME}_final.zkey`,
      'verification_key.json'
    ];

    filesToCopy.forEach(file => {
      const sourcePath = path.join(BUILD_DIR, file);
      const destPath = path.join(frontendPublicDir, file);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file} to frontend`);
      }
    });

    console.log('\n🎉 Circuit setup completed successfully!');
    console.log('\n📋 Generated files:');
    console.log(`- ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs (R1CS constraint system)`);
    console.log(`- ${BUILD_DIR}/${CIRCUIT_NAME}.wasm (WebAssembly)`);
    console.log(`- ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey (Proving key)`);
    console.log(`- ${BUILD_DIR}/verification_key.json (Verification key)`);
    console.log(`- contracts/Verifier.sol (Verifier contract)`);
    console.log(`- ${BUILD_DIR}/proof.json (Test proof)`);
    console.log(`- ${BUILD_DIR}/public.json (Public signals)`);

    console.log('\n🚀 Next steps:');
    console.log('1. Deploy the contracts: npm run deploy');
    console.log('2. Start the frontend: npm run frontend:start');
    console.log('3. Test the complete flow in the browser');

  } catch (error) {
    console.error('❌ Circuit setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupCircuit().catch(console.error);

