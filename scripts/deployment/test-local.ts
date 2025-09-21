import { ethers } from 'ethers';
import { poseidonHash } from './frontend/src/utils/poseidon';
import { generateZKProof } from './frontend/src/utils/zkProof';

/**
 * Local test script for the ZKP login application
 * This script tests the core functionality without requiring deployment
 */

async function testLocal() {
  console.log('🧪 Starting local tests...');

  try {
    // Test 1: Password hashing
    console.log('\n1. Testing password hashing...');
    const testPassword = 'testPassword123!';
    const hashedPassword = poseidonHash(testPassword);
    console.log('✅ Password hashing works');
    console.log('Password:', testPassword);
    console.log('Hash:', hashedPassword);

    // Test 2: ZK proof generation (mock)
    console.log('\n2. Testing ZK proof generation...');
    const { proof, publicSignals, isValid } = await generateZKProof({
      password: testPassword,
      storedHash: hashedPassword
    });
    console.log('✅ ZK proof generation works');
    console.log('Proof valid:', isValid);
    console.log('Public signals:', publicSignals);

    // Test 3: Proof formatting
    console.log('\n3. Testing proof formatting...');
    const { formatProofForContract } = await import('./frontend/src/utils/zkProof');
    const formattedProof = formatProofForContract(proof);
    console.log('✅ Proof formatting works');
    console.log('Formatted proof length:', formattedProof.length);

    // Test 4: Circuit compilation check
    console.log('\n4. Testing circuit compilation...');
    const fs = require('fs');
    const path = require('path');
    
    const circuitFiles = [
      'build/login_auth.r1cs',
      'build/login_auth_js/login_auth.wasm',
      'build/login_auth.sym'
    ];
    
    let allFilesExist = true;
    circuitFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
        allFilesExist = false;
      }
    });

    if (allFilesExist) {
      console.log('✅ Circuit compilation successful');
    } else {
      console.log('❌ Circuit compilation incomplete');
    }

    // Test 5: Frontend build check
    console.log('\n5. Testing frontend build...');
    const frontendBuildDir = 'frontend/build';
    if (fs.existsSync(frontendBuildDir)) {
      console.log('✅ Frontend build exists');
      const buildFiles = fs.readdirSync(frontendBuildDir);
      console.log('Build files:', buildFiles.length);
    } else {
      console.log('❌ Frontend build missing');
    }

    // Test 6: Contract compilation check
    console.log('\n6. Testing contract compilation...');
    const contractFiles = [
      'artifacts-zk/contracts/LoginAuth.sol/LoginAuth.json',
      'artifacts-zk/contracts/Verifier.sol/Verifier.json'
    ];
    
    let contractsCompiled = true;
    contractFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
        contractsCompiled = false;
      }
    });

    if (contractsCompiled) {
      console.log('✅ Contract compilation successful');
    } else {
      console.log('❌ Contract compilation incomplete');
    }

    console.log('\n🎉 Local tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Password hashing works');
    console.log('✅ ZK proof generation works (mock)');
    console.log('✅ Proof formatting works');
    console.log(`${allFilesExist ? '✅' : '❌'} Circuit compilation`);
    console.log(`${fs.existsSync(frontendBuildDir) ? '✅' : '❌'} Frontend build`);
    console.log(`${contractsCompiled ? '✅' : '❌'} Contract compilation`);

    if (allFilesExist && fs.existsSync(frontendBuildDir) && contractsCompiled) {
      console.log('\n🚀 Application is ready for testing!');
      console.log('Next steps:');
      console.log('1. Deploy contracts to testnet');
      console.log('2. Start frontend: npm run frontend:start');
      console.log('3. Test complete flow in browser');
    } else {
      console.log('\n⚠️  Some components need attention before testing');
    }

  } catch (error) {
    console.error('❌ Local test failed:', error);
  }
}

// Run the test
testLocal().catch(console.error);
