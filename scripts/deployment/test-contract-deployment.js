// Test script to verify contract deployment
const { ethers } = require('ethers');

async function testContractDeployment() {
  try {
    console.log('🔍 Testing contract deployment...');
    
    // Connect to zkSync Era Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.era.zksync.dev');
    
    // Test LoginAuth contract
    const loginAuthAddress = '0xe1912e23e8124a609ca1b3e1f37d3491dd072845';
    console.log('📋 Testing LoginAuth contract at:', loginAuthAddress);
    
    const code = await provider.getCode(loginAuthAddress);
    console.log('📄 Contract code length:', code.length);
    
    if (code === '0x') {
      console.log('❌ Contract not deployed at this address');
    } else {
      console.log('✅ Contract is deployed!');
      
      // Try to call a simple view function
      const abi = [
        "function admin() external view returns (address)",
        "function paused() external view returns (bool)"
      ];
      
      const contract = new ethers.Contract(loginAuthAddress, abi, provider);
      
      try {
        const admin = await contract.admin();
        console.log('👤 Admin address:', admin);
        
        const paused = await contract.paused();
        console.log('⏸️ Contract paused:', paused);
        
        console.log('✅ Contract is working correctly!');
      } catch (error) {
        console.log('⚠️ Contract deployed but may have issues:', error.message);
      }
    }
    
    // Test Verifier contract
    const verifierAddress = '0xea3a6421520c28f6089241e162d80f487dc9adc8';
    console.log('\n📋 Testing Verifier contract at:', verifierAddress);
    
    const verifierCode = await provider.getCode(verifierAddress);
    console.log('📄 Verifier code length:', verifierCode.length);
    
    if (verifierCode === '0x') {
      console.log('❌ Verifier contract not deployed at this address');
    } else {
      console.log('✅ Verifier contract is deployed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing contracts:', error);
  }
}

testContractDeployment();


