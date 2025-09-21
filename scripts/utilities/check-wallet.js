// Check wallet balance and network connectivity
const { ethers } = require('ethers');

async function checkWallet() {
  try {
    console.log('🔍 Checking wallet and network...');
    
    // Load private key from .env
    require('dotenv').config();
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      console.log('❌ No private key found in .env file');
      return;
    }
    
    console.log('🔑 Private key found:', privateKey.substring(0, 10) + '...');
    
    // Connect to zkSync Era Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.era.zksync.dev');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('👤 Wallet address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log('💰 Balance:', balanceEth, 'ETH');
    
    if (parseFloat(balanceEth) < 0.01) {
      console.log('⚠️ Low balance! You need at least 0.01 ETH for deployment');
      console.log('💡 Get testnet ETH from: https://sepolia-era.zksync.network/faucet');
    } else {
      console.log('✅ Sufficient balance for deployment');
    }
    
    // Check network
    const network = await provider.getNetwork();
    console.log('🌐 Network:', network.name, '(Chain ID:', network.chainId, ')');
    
    // Check latest block
    const blockNumber = await provider.getBlockNumber();
    console.log('📦 Latest block:', blockNumber);
    
  } catch (error) {
    console.error('❌ Error checking wallet:', error.message);
  }
}

checkWallet();


