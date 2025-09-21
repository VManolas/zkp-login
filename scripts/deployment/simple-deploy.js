// Simple deployment script with detailed output
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deployContracts() {
  try {
    console.log('🚀 Starting simple deployment...');
    
    // Load environment variables
    require('dotenv').config();
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in .env file');
    }
    
    // Connect to zkSync Era Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.era.zksync.dev');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 Deployer address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
    
    // Verifier contract ABI and bytecode (simplified)
    const verifierABI = [
      "function verifyProof(bytes calldata proof, uint256[2] calldata publicSignals) external view returns (bool)"
    ];
    
    // For now, let's just check if we can interact with the existing contracts
    console.log('🔍 Checking existing contracts...');
    
    const loginAuthAddress = '0xe1912e23e8124a609ca1b3e1f37d3491dd072845';
    const verifierAddress = '0xea3a6421520c28f6089241e162d80f487dc9adc8';
    
    // Check if contracts exist
    const loginAuthCode = await provider.getCode(loginAuthAddress);
    const verifierCode = await provider.getCode(verifierAddress);
    
    console.log('📋 LoginAuth contract code length:', loginAuthCode.length);
    console.log('📋 Verifier contract code length:', verifierCode.length);
    
    if (loginAuthCode === '0x' || verifierCode === '0x') {
      console.log('❌ Contracts are not deployed. Need to deploy them.');
      console.log('💡 The deployment script might be failing silently.');
      console.log('💡 Try running: npx hardhat run scripts/deploy.ts --network zkSyncEraTestnet --verbose');
    } else {
      console.log('✅ Contracts are already deployed!');
      
      // Test the contracts
      try {
        const loginAuthABI = [
          "function admin() external view returns (address)",
          "function paused() external view returns (bool)"
        ];
        
        const loginAuthContract = new ethers.Contract(loginAuthAddress, loginAuthABI, provider);
        const admin = await loginAuthContract.admin();
        const paused = await loginAuthContract.paused();
        
        console.log('👤 LoginAuth admin:', admin);
        console.log('⏸️ LoginAuth paused:', paused);
        console.log('✅ Contracts are working!');
        
      } catch (error) {
        console.log('⚠️ Contracts deployed but may have issues:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Deployment error:', error);
  }
}

deployContracts();


