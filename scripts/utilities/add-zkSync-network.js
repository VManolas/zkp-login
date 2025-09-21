// Script to add zkSync Era Sepolia network to MetaMask
// Run this in the browser console on the frontend page

const addZkSyncNetwork = async () => {
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
    console.log('✅ zkSync Era Sepolia network added successfully!');
  } catch (error) {
    console.error('❌ Error adding network:', error);
  }
};

// Run the function
addZkSyncNetwork();


