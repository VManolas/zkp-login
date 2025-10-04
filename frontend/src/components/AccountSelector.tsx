import React, { useState, useEffect } from 'react';
import { ContractManager } from '../utils/contracts';
import { ContractAddresses } from '../types';

interface AccountSelectorProps {
  contractManager: ContractManager;
  onAccountSelected: (address: string) => void;
  currentAccount?: string;
}

interface AccountInfo {
  address: string;
  balance: string;
  isRegistered: boolean;
  userStats?: any;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  contractManager,
  onAccountSelected,
  currentAccount
}) => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const accountsInfo = await contractManager.getAllAccountsInfo();
      setAccounts(accountsInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Connect to the selected account
      await contractManager.connectWallet(address);
      onAccountSelected(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch account');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  if (loading && accounts.length === 0) {
    return (
      <div className="account-selector">
        <div className="loading">Loading accounts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-selector">
        <div className="error">Error: {error}</div>
        <button onClick={loadAccounts} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="account-selector">
        <div className="no-accounts">No accounts found. Please unlock MetaMask.</div>
      </div>
    );
  }

  return (
    <div className="account-selector">
      <h3>Select Account</h3>
      <div className="accounts-list">
        {accounts.map((account) => (
          <div
            key={account.address}
            className={`account-item ${currentAccount === account.address ? 'selected' : ''}`}
            onClick={() => handleAccountSelect(account.address)}
          >
            <div className="account-address">
              {formatAddress(account.address)}
              {currentAccount === account.address && <span className="current">(Current)</span>}
            </div>
            <div className="account-balance">
              {formatBalance(account.balance)} ETH
            </div>
            <div className="account-status">
              {account.isRegistered ? (
                <span className="registered">✓ Registered</span>
              ) : (
                <span className="not-registered">Not registered</span>
              )}
            </div>
            {account.userStats && (
              <div className="account-stats">
                <small>
                  {account.userStats.successful} successful logins
                </small>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={loadAccounts} className="refresh-btn" disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Accounts'}
      </button>
    </div>
  );
};

export default AccountSelector;









