import React, { useState, useEffect } from 'react';
import { ContractManager } from '../utils/contracts';
import { ContractAddresses } from '../types';
import AccountSelector from '../components/AccountSelector';

// Example contract addresses (replace with your actual addresses)
const contractAddresses: ContractAddresses = {
  verifier: "0x47D954fb1e51ae1C1BA6c85BBfcD87B9659326E5",
  loginAuth: "0xeC0af5d83AAFA45e2C945BA2ee2E0fedc1dAE9e4"
};

const MultiAccountExample: React.FC = () => {
  const [contractManager] = useState(() => new ContractManager(contractAddresses));
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current account info when account changes
  useEffect(() => {
    if (currentAccount) {
      loadAccountInfo();
    }
  }, [currentAccount]);

  const loadAccountInfo = async () => {
    if (!currentAccount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const info = await contractManager.getAccountInfo(currentAccount);
      setAccountInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account info');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelected = (address: string) => {
    setCurrentAccount(address);
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const address = await contractManager.connectWallet();
      setCurrentAccount(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setCurrentAccount(null);
    setAccountInfo(null);
  };

  return (
    <div className="multi-account-example">
      <h2>Multi-Account ZKP Authentication Demo</h2>
      
      {!currentAccount ? (
        <div className="connect-section">
          <button 
            onClick={handleConnectWallet} 
            disabled={loading}
            className="connect-btn"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {error && <div className="error">Error: {error}</div>}
        </div>
      ) : (
        <div className="connected-section">
          <div className="current-account">
            <h3>Current Account</h3>
            <p>Address: {currentAccount}</p>
            {accountInfo && (
              <div className="account-details">
                <p>Balance: {parseFloat(accountInfo.balance).toFixed(4)} ETH</p>
                <p>Status: {accountInfo.isRegistered ? 'Registered' : 'Not Registered'}</p>
                {accountInfo.userStats && (
                  <div className="user-stats">
                    <p>Login Attempts: {accountInfo.userStats.attempts}</p>
                    <p>Successful Logins: {accountInfo.userStats.successful}</p>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          </div>

          <div className="account-selector-section">
            <AccountSelector
              contractManager={contractManager}
              onAccountSelected={handleAccountSelected}
              currentAccount={currentAccount}
            />
          </div>
        </div>
      )}

      <div className="instructions">
        <h3>How to Use Multi-Account Support:</h3>
        <ol>
          <li>Make sure you have multiple accounts in MetaMask</li>
          <li>Connect your wallet - it will use the currently selected account</li>
          <li>Use the account selector to switch between accounts</li>
          <li>Each account maintains its own registration and login state</li>
          <li>Account changes are automatically detected and handled</li>
        </ol>
      </div>
    </div>
  );
};

export default MultiAccountExample;
