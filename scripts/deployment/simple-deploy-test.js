// Simple deployment test using zkSync ethers directly
const { ethers } = require('ethers');
const fs = require('fs');

async function deployContracts() {
  try {
    console.log('🚀 Starting simple deployment test...');
    
    // Load environment
    require('dotenv').config();
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found');
    }
    
    console.log('✅ Private key loaded');
    
    // Connect to zkSync Era Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.era.zksync.dev');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('✅ Connected to zkSync Era Sepolia');
    console.log('👤 Wallet address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.01')) {
      throw new Error('Insufficient balance');
    }
    
    // For now, let's just test if we can interact with the network
    console.log('🧪 Testing network interaction...');
    
    const blockNumber = await provider.getBlockNumber();
    console.log('📦 Current block:', blockNumber);
    
    const network = await provider.getNetwork();
    console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId.toString());
    
    // Test a simple transaction (just getting gas price)
    const gasPrice = await provider.getGasPrice();
    console.log('⛽ Gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
    
    console.log('✅ Network interaction successful');
    console.log('💡 The issue might be with the zkSync deployment setup');
    console.log('💡 Let me try a different approach...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

deployContracts();


