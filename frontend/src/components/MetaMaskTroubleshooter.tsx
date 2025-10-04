import React, { useState, useEffect } from 'react';
import { ContractManager } from '../utils/contracts';

interface MetaMaskTroubleshooterProps {
  contractManager: ContractManager;
  onRetry: () => void;
}

interface MetaMaskStatus {
  isInstalled: boolean;
  isUnlocked: boolean;
  accounts: string[];
  networkId?: string;
  error?: string;
}

const MetaMaskTroubleshooter: React.FC<MetaMaskTroubleshooterProps> = ({
  contractManager,
  onRetry
}) => {
  const [status, setStatus] = useState<MetaMaskStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const metaMaskStatus = await contractManager.checkMetaMaskStatus();
      setStatus(metaMaskStatus);
    } catch (error) {
      console.error('Error checking MetaMask status:', error);
      setStatus({
        isInstalled: false,
        isUnlocked: false,
        accounts: [],
        error: 'Failed to check MetaMask status'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getNetworkName = (chainId?: string) => {
    if (!chainId) return 'Unknown';
    const id = parseInt(chainId, 16);
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Ethereum Sepolia',
      300: 'zkSync Era Sepolia',
      324: 'zkSync Era Mainnet',
      280: 'zkSync Era Testnet (deprecated)'
    };
    return networks[id] || `Unknown Network (${id})`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="metamask-troubleshooter">
        <h3>🔍 Checking MetaMask Status...</h3>
        <div className="loading">Please wait while we check your MetaMask connection...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="metamask-troubleshooter">
        <h3>❌ MetaMask Status Check Failed</h3>
        <button onClick={checkStatus} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="metamask-troubleshooter">
      <h3>🔧 MetaMask Troubleshooter</h3>
      
      <div className="status-section">
        <h4>Status Check Results:</h4>
        
        <div className="status-item">
          <span className="label">MetaMask Installed:</span>
          <span className={`value ${status.isInstalled ? 'success' : 'error'}`}>
            {status.isInstalled ? '✅ Yes' : '❌ No'}
          </span>
        </div>

        <div className="status-item">
          <span className="label">MetaMask Unlocked:</span>
          <span className={`value ${status.isUnlocked ? 'success' : 'error'}`}>
            {status.isUnlocked ? '✅ Yes' : '❌ No'}
          </span>
        </div>

        <div className="status-item">
          <span className="label">Accounts Found:</span>
          <span className={`value ${status.accounts.length > 0 ? 'success' : 'error'}`}>
            {status.accounts.length > 0 ? `✅ ${status.accounts.length}` : '❌ None'}
          </span>
        </div>

        <div className="status-item">
          <span className="label">Current Network:</span>
          <span className={`value ${status.networkId === '0x12c' ? 'success' : 'warning'}`}>
            {getNetworkName(status.networkId)}
            {status.networkId === '0x12c' ? ' ✅' : ' ⚠️'}
          </span>
        </div>

        {status.error && (
          <div className="error-message">
            <strong>Error:</strong> {status.error}
          </div>
        )}
      </div>

      {status.accounts.length > 0 && (
        <div className="accounts-section">
          <h4>Available Accounts:</h4>
          <div className="accounts-list">
            {status.accounts.map((account, index) => (
              <div key={account} className="account-item">
                <span className="account-index">#{index + 1}</span>
                <span className="account-address">{formatAddress(account)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="solutions-section">
        <h4>Solutions:</h4>
        <ul>
          {!status.isInstalled && (
            <li>
              <strong>Install MetaMask:</strong> Download and install the MetaMask browser extension from{' '}
              <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
                metamask.io
              </a>
            </li>
          )}
          
          {status.isInstalled && !status.isUnlocked && (
            <li>
              <strong>Unlock MetaMask:</strong> Click on the MetaMask extension icon and enter your password to unlock it
            </li>
          )}
          
          {status.isUnlocked && status.accounts.length === 0 && (
            <li>
              <strong>Create/Import Account:</strong> Create a new account or import an existing one in MetaMask
            </li>
          )}
          
          {status.networkId !== '0x12c' && (
            <li>
              <strong>Switch Network:</strong> Switch to zkSync Era Sepolia testnet (Chain ID: 300) in MetaMask
            </li>
          )}
          
          <li>
            <strong>Refresh Page:</strong> After fixing the issues, refresh this page and try again
          </li>
        </ul>
      </div>

      <div className="actions">
        <button onClick={checkStatus} className="check-btn">
          🔄 Check Again
        </button>
        <button onClick={onRetry} className="retry-btn">
          🔗 Try Connect Again
        </button>
      </div>
    </div>
  );
};

export default MetaMaskTroubleshooter;









