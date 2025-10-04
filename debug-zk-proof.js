const snarkjs = require('snarkjs');
const fs = require('fs');
const { ethers } = require('ethers');
const { poseidon } = require('poseidon-hash');

async function debugZKProof() {
  try {
    console.log('🔍 Debugging ZK Proof Generation...\n');
    
    // Test with a simple password
    const password = 'test123';
    console.log('1️⃣ Password:', password);
    
    // Calculate hash using the same method as frontend
    const inputBytes = ethers.toUtf8Bytes(password);
    const inputBigInt = BigInt(ethers.hexlify(inputBytes));
    const hash = poseidon([inputBigInt]);
    const storedHash = '0x' + hash.toString(16);
    
    console.log('2️⃣ Calculated stored hash:', storedHash);
    
    // Convert password to BigInt for circuit (same method as frontend)
    const passwordBytes = Buffer.from(password, 'utf8');
    const passwordBigInt = BigInt('0x' + passwordBytes.toString('hex'));
    
    console.log('3️⃣ Password BigInt:', passwordBigInt.toString());
    
    const circuitInput = {
      password: passwordBigInt.toString(),
      storedHash: storedHash
    };
    
    console.log('4️⃣ Circuit input:', circuitInput);
    
    // Check if circuit files exist
    const wasmPath = './build/login_auth_js/login_auth.wasm';
    const zkeyPath = './build/login_auth_final.zkey';
    
    console.log('5️⃣ Checking circuit files...');
    console.log('   WASM exists:', fs.existsSync(wasmPath));
    console.log('   Zkey exists:', fs.existsSync(zkeyPath));
    
    if (!fs.existsSync(wasmPath)) {
      console.error('❌ WASM file not found:', wasmPath);
      return;
    }
    
    if (!fs.existsSync(zkeyPath)) {
      console.error('❌ Zkey file not found:', zkeyPath);
      return;
    }
    
    console.log('6️⃣ Generating proof...');
    
    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        wasmPath,
        zkeyPath
      );
      
      console.log('✅ Proof generated successfully!');
      console.log('   Public signals:', publicSignals);
      console.log('   Number of public signals:', publicSignals.length);
      
      if (publicSignals.length === 1) {
        console.log('✅ Correct number of public signals (1)');
        console.log('   Stored hash from proof:', publicSignals[0]);
        console.log('   Expected stored hash:', storedHash);
        console.log('   Hashes match:', publicSignals[0] === storedHash);
      } else {
        console.log('❌ Incorrect number of public signals:', publicSignals.length);
      }
      
    } catch (proofError) {
      console.error('❌ Proof generation failed:', proofError.message);
      console.error('   Error details:', proofError);
      
      // Try to get more specific error information
      if (proofError.message && proofError.message.includes('Assert Failed')) {
        console.log('🔍 This is a circuit constraint failure - password might not match stored hash');
      } else if (proofError.message && proofError.message.includes('Invalid witness length')) {
        console.log('🔍 This is a witness length mismatch - circuit might be out of sync');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugZKProof();


