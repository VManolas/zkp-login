import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Users, 
  UserX, 
  Pause, 
  Play, 
  RotateCcw, 
  Crown, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Search,
  RefreshCw
} from 'lucide-react';
import { ContractManager } from '../utils/contracts';
import { toast } from 'react-hot-toast';

interface AdminPanelProps {
  contractManager: ContractManager | null;
  userAddress: string | undefined;
  onUserRemoved: () => void;
}

interface UserInfo {
  address: string;
  balance: string;
  isRegistered: boolean;
  userStats?: {
    attempts: number;
    successful: number;
    registered: boolean;
    lastAttempt: number;
    registrationTime: number;
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  contractManager,
  userAddress,
  onUserRemoved
}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [showTransferAdmin, setShowTransferAdmin] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!contractManager || !userAddress) return;
    
    try {
      const adminStatus = await contractManager.isAdmin();
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        const adminAddr = await contractManager.getAdminAddress();
        setAdminAddress(adminAddr);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, [contractManager, userAddress]);

  const loadContractStatus = useCallback(async () => {
    if (!contractManager) return;
    
    try {
      const paused = await contractManager.isContractPaused();
      setIsPaused(paused);
    } catch (error) {
      console.error('Error loading contract status:', error);
    }
  }, [contractManager]);

  const loadUsers = useCallback(async () => {
    if (!contractManager) return;
    
    try {
      setLoading(true);
      const accountsInfo = await contractManager.getAllAccountsInfo();
      setUsers(accountsInfo);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [contractManager]);

  const handleRemoveUser = async (userAddress: string) => {
    if (!contractManager) return;
    
    if (!window.confirm(`Are you sure you want to remove user ${userAddress}? This will delete their stored hash and they will need to register again.`)) {
      return;
    }

    try {
      setLoading(true);
      toast.loading('Removing user...', { id: 'remove-user' });
      
      await contractManager.removeUser(userAddress);
      
      toast.success('User removed successfully!', { id: 'remove-user' });
      await loadUsers();
      onUserRemoved();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAttempts = async (userAddress: string) => {
    if (!contractManager) return;
    
    try {
      setLoading(true);
      toast.loading('Resetting user attempts...', { id: 'reset-attempts' });
      
      await contractManager.resetUserAttempts(userAddress);
      
      toast.success('User attempts reset successfully!', { id: 'reset-attempts' });
      await loadUsers();
    } catch (error) {
      console.error('Error resetting attempts:', error);
      toast.error('Failed to reset user attempts');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseContract = async () => {
    if (!contractManager) return;
    
    try {
      setLoading(true);
      toast.loading('Pausing contract...', { id: 'pause-contract' });
      
      await contractManager.pauseContract();
      
      toast.success('Contract paused successfully!', { id: 'pause-contract' });
      await loadContractStatus();
    } catch (error) {
      console.error('Error pausing contract:', error);
      toast.error('Failed to pause contract');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpauseContract = async () => {
    if (!contractManager) return;
    
    try {
      setLoading(true);
      toast.loading('Unpausing contract...', { id: 'unpause-contract' });
      
      await contractManager.unpauseContract();
      
      toast.success('Contract unpaused successfully!', { id: 'unpause-contract' });
      await loadContractStatus();
    } catch (error) {
      console.error('Error unpausing contract:', error);
      toast.error('Failed to unpause contract');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAdmin = async () => {
    if (!contractManager || !newAdminAddress) return;
    
    if (!window.confirm(`Are you sure you want to transfer admin role to ${newAdminAddress}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      toast.loading('Transferring admin role...', { id: 'transfer-admin' });
      
      await contractManager.transferAdmin(newAdminAddress);
      
      toast.success('Admin role transferred successfully!', { id: 'transfer-admin' });
      setNewAdminAddress('');
      setShowTransferAdmin(false);
      await checkAdminStatus();
    } catch (error) {
      console.error('Error transferring admin:', error);
      toast.error('Failed to transfer admin role');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.address.toLowerCase().includes(searchAddress.toLowerCase())
  );

  // Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
    loadContractStatus();
    loadUsers();
  }, [contractManager, userAddress, checkAdminStatus, loadContractStatus, loadUsers]);

  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-access-denied">
          <Shield className="admin-icon" size={48} />
          <h2>Admin Access Required</h2>
          <p>You need admin privileges to access this panel.</p>
          <p>Current admin: <code>{adminAddress || 'Loading...'}</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title">
          <Crown className="admin-icon" size={24} />
          <h2>Admin Panel</h2>
        </div>
        <div className="admin-actions">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="admin-refresh-button"
            title="Refresh users"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Contract Status */}
      <div className="admin-section">
        <h3>Contract Status</h3>
        <div className="contract-status">
          <div className="status-item">
            <span className="status-label">Status:</span>
            <span className={`status-value ${isPaused ? 'paused' : 'active'}`}>
              {isPaused ? (
                <>
                  <Pause size={16} />
                  Paused
                </>
              ) : (
                <>
                  <Play size={16} />
                  Active
                </>
              )}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Admin:</span>
            <span className="status-value">
              <code>{adminAddress}</code>
              <button
                onClick={() => copyToClipboard(adminAddress)}
                className="copy-button"
                title="Copy admin address"
              >
                <Copy size={12} />
              </button>
            </span>
          </div>
        </div>
        <div className="contract-actions">
          {isPaused ? (
            <button
              onClick={handleUnpauseContract}
              disabled={loading}
              className="admin-action-button unpause"
            >
              <Play size={16} />
              Unpause Contract
            </button>
          ) : (
            <button
              onClick={handlePauseContract}
              disabled={loading}
              className="admin-action-button pause"
            >
              <Pause size={16} />
              Pause Contract
            </button>
          )}
        </div>
      </div>

      {/* User Management */}
      <div className="admin-section">
        <h3>User Management</h3>
        
        <div className="user-search">
          <div className="search-input-container">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="users-list">
          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spinner" size={20} />
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Users size={32} />
              <p>No users found</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.address} className="user-card">
                <div className="user-info">
                  <div className="user-address">
                    <code>{user.address}</code>
                    <button
                      onClick={() => copyToClipboard(user.address)}
                      className="copy-button"
                      title="Copy address"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <div className="user-details">
                    <span className={`user-status ${user.isRegistered ? 'registered' : 'not-registered'}`}>
                      {user.isRegistered ? (
                        <>
                          <CheckCircle size={14} />
                          Registered
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} />
                          Not Registered
                        </>
                      )}
                    </span>
                    <span className="user-balance">
                      Balance: {user.balance} ETH
                    </span>
                  </div>
                  {user.userStats && (
                    <div className="user-stats">
                      <span>Attempts: {user.userStats.attempts}</span>
                      <span>Successful: {user.userStats.successful}</span>
                      <span>Last Attempt: {new Date(user.userStats.lastAttempt * 1000).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="user-actions">
                  {user.isRegistered && (
                    <>
                      <button
                        onClick={() => handleResetAttempts(user.address)}
                        disabled={loading}
                        className="admin-action-button reset"
                        title="Reset login attempts"
                      >
                        <RotateCcw size={16} />
                        Reset Attempts
                      </button>
                      <button
                        onClick={() => handleRemoveUser(user.address)}
                        disabled={loading}
                        className="admin-action-button remove"
                        title="Remove user (deactivate hash)"
                      >
                        <UserX size={16} />
                        Remove User
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Admin Transfer */}
      <div className="admin-section">
        <h3>Admin Management</h3>
        <div className="admin-transfer">
          <div className="transfer-form">
            <input
              type="text"
              placeholder="New admin address..."
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
              className="admin-input"
            />
            <button
              onClick={() => setShowTransferAdmin(!showTransferAdmin)}
              className="admin-action-button transfer"
            >
              <Crown size={16} />
              Transfer Admin
            </button>
          </div>
          {showTransferAdmin && (
            <div className="transfer-confirmation">
              <p>⚠️ This will transfer admin privileges to the new address. You will lose admin access.</p>
              <div className="transfer-actions">
                <button
                  onClick={handleTransferAdmin}
                  disabled={loading || !newAdminAddress}
                  className="admin-action-button confirm"
                >
                  Confirm Transfer
                </button>
                <button
                  onClick={() => setShowTransferAdmin(false)}
                  className="admin-action-button cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
