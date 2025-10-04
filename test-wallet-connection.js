// Test script to verify wallet connection with updated zkSync ethers implementation
const { Provider, BrowserProvider, Signer, types } = require('zksync-ethers');

async function testWalletConnection() {
  try {
    console.log('Testing zkSync wallet connection...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('This test requires a browser environment with MetaMask');
      return;
    }
    
    if (!window.ethereum) {
      console.log('MetaMask not detected');
      return;
    }
    
    // Initialize zkSync provider
    const l2Provider = Provider.getDefaultProvider(types.Network.Sepolia);
    console.log('L2 Provider initialized');
    
    // Initialize browser provider
    const browserProvider = new BrowserProvider(window.ethereum, {
      name: 'zkSync Era Sepolia',
      chainId: 300
    });
    console.log('Browser Provider initialized');
    
    // Get L1 signer
    const l1Signer = await browserProvider.getSigner();
    console.log('L1 Signer address:', await l1Signer.getAddress());
    
    // Create zkSync signer
    const zkSyncSigner = await Signer.from(l1Signer, l2Provider, 300);
    console.log('zkSync Signer created successfully');
    console.log('zkSync Signer address:', await zkSyncSigner.getAddress());
    
    // Test network info
    const network = await l2Provider.getNetwork();
    console.log('L2 Network:', network);
    
    // Test balance
    const balance = await zkSyncSigner.getBalance();
    console.log('Balance:', balance.toString(), 'wei');
    
    console.log('✅ Wallet connection test successful!');
    
  } catch (error) {
    console.error('❌ Wallet connection test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the test if in browser
if (typeof window !== 'undefined') {
  testWalletConnection();
} else {
  console.log('This script should be run in a browser environment');
}
