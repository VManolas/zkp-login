import React, { useState } from 'react';
import { ContractManager } from '../utils/contracts';
import { ContractAddresses } from '../types';
import MetaMaskTroubleshooter from '../components/MetaMaskTroubleshooter';

// Contract addresses
const contractAddresses: ContractAddresses = {
  verifier: "0x47D954fb1e51ae1C1BA6c85BBfcD87B9659326E5",
  loginAuth: "0xeC0af5d83AAFA45e2C945BA2ee2E0fedc1dAE9e4"
};

const MetaMaskTest: React.FC = () => {
  const [contractManager] = useState(() => new ContractManager(contractAddresses));
  const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    setConnectionStatus('Connecting...');

    try {
      const address = await contractManager.connectWallet();
      setConnectionStatus(`Connected to: ${address}`);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnectionStatus('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setConnectionStatus('Not connected');
    handleConnect();
  };

  return (
    <div className="metamask-test-page">
      <h1>MetaMask Connection Test</h1>
      
      <div className="connection-section">
        <h2>Connection Status</h2>
        <div className={`status ${error ? 'error' : connectionStatus.includes('Connected') ? 'success' : 'info'}`}>
          {connectionStatus}
        </div>
        
        {error && (
          <div className="error-details">
            <strong>Error Details:</strong>
            <pre>{error}</pre>
          </div>
        )}

        <button 
          onClick={handleConnect} 
          disabled={loading}
          className="connect-btn"
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>

      <div className="troubleshooter-section">
        <MetaMaskTroubleshooter 
          contractManager={contractManager}
          onRetry={handleRetry}
        />
      </div>

      <div className="instructions">
        <h2>How to Fix Common Issues:</h2>
        <ol>
          <li>
            <strong>MetaMask Not Installed:</strong>
            <ul>
              <li>Install MetaMask extension from <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">metamask.io</a></li>
              <li>Refresh the page after installation</li>
            </ul>
          </li>
          
          <li>
            <strong>MetaMask Locked:</strong>
            <ul>
              <li>Click on the MetaMask extension icon in your browser</li>
              <li>Enter your password to unlock MetaMask</li>
              <li>Make sure at least one account is available</li>
            </ul>
          </li>
          
          <li>
            <strong>Wrong Network:</strong>
            <ul>
              <li>Switch to zkSync Era Sepolia testnet (Chain ID: 300)</li>
              <li>If the network is not added, add it manually with these details:</li>
              <ul>
                <li>Network Name: zkSync Era Sepolia Testnet</li>
                <li>RPC URL: https://sepolia.era.zksync.dev</li>
                <li>Chain ID: 300</li>
                <li>Currency Symbol: ETH</li>
                <li>Block Explorer: https://sepolia-era.zksync.network</li>
              </ul>
            </ul>
          </li>
          
          <li>
            <strong>No Accounts:</strong>
            <ul>
              <li>Create a new account in MetaMask</li>
              <li>Or import an existing account using seed phrase or private key</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default MetaMaskTest;









