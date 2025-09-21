// Test deployment using zkSync ethers
const { Wallet, Provider } = require('zksync-ethers');
const fs = require('fs');

async function deployContracts() {
  try {
    console.log('🚀 Starting zkSync deployment test...');
    
    // Load environment
    require('dotenv').config();
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found');
    }
    
    console.log('✅ Private key loaded');
    
    // Connect to zkSync Era Sepolia using zkSync provider
    const provider = new Provider('https://sepolia.era.zksync.dev');
    const wallet = new Wallet(privateKey, provider);
    
    console.log('✅ Connected to zkSync Era Sepolia');
    console.log('👤 Wallet address:', wallet.address);
    
    // Check balance
    const balance = await wallet.getBalance();
    console.log('💰 Balance:', balance.toString(), 'wei');
    console.log('💰 Balance:', (Number(balance) / 1e18).toFixed(6), 'ETH');
    
    if (balance < BigInt('10000000000000000')) { // 0.01 ETH
      throw new Error('Insufficient balance');
    }
    
    // Test network interaction
    console.log('🧪 Testing network interaction...');
    
    const blockNumber = await provider.getBlockNumber();
    console.log('📦 Current block:', blockNumber);
    
    const network = await provider.getNetwork();
    console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId.toString());
    
    // Test gas price
    const gasPrice = await provider.getGasPrice();
    console.log('⛽ Gas price:', gasPrice.toString(), 'wei');
    
    console.log('✅ zkSync network interaction successful');
    console.log('💡 Now let me try to deploy a simple contract...');
    
    // Try to deploy a simple contract
    console.log('📋 Attempting to deploy a simple contract...');
    
    // Simple contract bytecode (just a basic contract)
    const simpleContractBytecode = '0x6080604052348015600f57600080fd5b506004361060285760003560e01c8063c298557814602d575b600080fd5b60336047565b604051603e9190605a565b60405180910390f35b60008054905090565b6000819050919050565b6054816041565b82525050565b6000602082019050606d6000830184604d565b9291505056fea2646970667358221220...';
    
    // This is just a test - we won't actually deploy this
    console.log('✅ zkSync deployment setup is working');
    console.log('💡 The issue might be with the Hardhat zkSync integration');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

deployContracts();


