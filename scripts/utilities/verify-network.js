// Network verification script
// Run this in the browser console on the frontend page

const verifyNetwork = async () => {
  try {
    // Check current network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const chainIdDecimal = parseInt(chainId, 16);
    
    console.log('🔍 Current Network Check:');
    console.log('Chain ID (hex):', chainId);
    console.log('Chain ID (decimal):', chainIdDecimal);
    
    if (chainIdDecimal === 300) {
      console.log('✅ Correct! You are on zkSync Era Sepolia (Chain ID: 300)');
    } else if (chainIdDecimal === 11155111) {
      console.log('❌ Wrong! You are on regular Sepolia (Chain ID: 11155111)');
      console.log('🔄 Switching to zkSync Era Sepolia...');
      await switchToZkSyncEra();
    } else {
      console.log('❌ Unknown network. Expected Chain ID: 300 (zkSync Era Sepolia)');
      console.log('🔄 Switching to zkSync Era Sepolia...');
      await switchToZkSyncEra();
    }
    
    // Check account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    console.log('👤 Connected accounts:', accounts);
    
    // Check balance
    if (accounts.length > 0) {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });
      const balanceEth = parseInt(balance, 16) / Math.pow(10, 18);
      console.log('💰 Balance:', balanceEth, 'ETH');
      
      if (balanceEth < 0.001) {
        console.log('⚠️ Low balance! Get testnet ETH from: https://sepolia-era.zksync.network/faucet');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking network:', error);
  }
};

const switchToZkSyncEra = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x12c' }], // 300 in hex
    });
    console.log('✅ Switched to zkSync Era Sepolia!');
  } catch (switchError) {
    if (switchError.code === 4902) {
      // Network not added, add it
      console.log('➕ Adding zkSync Era Sepolia network...');
      await addZkSyncEraNetwork();
    } else {
      console.error('❌ Error switching network:', switchError);
    }
  }
};

const addZkSyncEraNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x12c', // 300 in hex
        chainName: 'zkSync Era Sepolia Testnet',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://sepolia.era.zksync.dev'],
        blockExplorerUrls: ['https://sepolia-era.zksync.network'],
      }],
    });
    console.log('✅ zkSync Era Sepolia network added and switched!');
  } catch (error) {
    console.error('❌ Error adding network:', error);
  }
};

// Run the verification
verifyNetwork();


