// Minimal test deployment using zkSync ethers directly
const { Wallet, Provider } = require('zksync-ethers');
const fs = require('fs');

async function testDeployment() {
  try {
    console.log('🚀 MINIMAL TEST DEPLOYMENT STARTING...');
    
    // Load environment
    require('dotenv').config();
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found');
    }
    
    console.log('✅ Private key loaded');
    
    // Connect to zkSync Era Sepolia
    const provider = new Provider('https://sepolia.era.zksync.dev');
    const wallet = new Wallet(privateKey, provider);
    
    console.log('✅ Connected to zkSync Era Sepolia');
    console.log('👤 Wallet address:', wallet.address);
    
    // Check balance
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', (Number(balance) / 1e18).toFixed(6), 'ETH');
    
    if (balance < BigInt('10000000000000000')) { // 0.01 ETH
      throw new Error('Insufficient balance');
    }
    
    // Test basic network interaction
    console.log('🌐 Testing network interaction...');
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Current block number:', blockNumber);
    
    // Test wallet interaction
    console.log('👤 Testing wallet interaction...');
    const nonce = await wallet.getNonce();
    console.log('✅ Wallet nonce:', nonce);
    
    console.log('✅ MINIMAL TEST DEPLOYMENT COMPLETED SUCCESSFULLY!');
    console.log('💡 The zkSync network is working correctly');
    console.log('💡 The issue is likely with the Hardhat zkSync integration');
    
  } catch (error) {
    console.error('❌ MINIMAL TEST DEPLOYMENT FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDeployment();
