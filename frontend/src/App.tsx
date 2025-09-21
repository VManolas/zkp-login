import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Wallet, LogOut, Settings, Shield, Activity } from 'lucide-react';
import { ContractManager } from './utils/contracts';
import { generateZKProof, formatProofForContract } from './utils/zkProof';
import { poseidonHash } from './utils/poseidon';
import { LoginState, ContractAddresses, LoginAttemptResult } from './types';
import { LoginForm } from './components/LoginForm';
import { RegistrationForm } from './components/RegistrationForm';
import { UserStats } from './components/UserStats';
import './App.css';

// Load contract addresses from config
import contractConfig from './config/contracts.json';

const CONTRACT_ADDRESSES: ContractAddresses = {
  verifier: contractConfig.verifier,
  loginAuth: contractConfig.loginAuth
};

function App() {
  const [loginState, setLoginState] = useState<LoginState>({
    isConnected: false,
    isRegistered: false,
    isLoggedIn: false,
    userAddress: undefined,
    userStats: undefined,
    globalStats: undefined,
    canAttemptLogin: true,
    loginReason: undefined
  });
  
  // const [password, setPassword] = useState(''); // Removed unused state
  const [loading, setLoading] = useState(false);
  const [contractManager, setContractManager] = useState<ContractManager | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'stats'>('login');

  // Initialize contract manager
  useEffect(() => {
    const manager = new ContractManager(CONTRACT_ADDRESSES);
    setContractManager(manager);
  }, []);

  const checkUserStatus = useCallback(async () => {
    if (!contractManager || !loginState.userAddress) {
      console.log('Cannot check user status: contractManager or userAddress missing');
      return;
    }

    try {
      console.log('Checking user status for address:', loginState.userAddress);
      const [isRegistered, userStats, globalStats, canAttemptLogin] = await Promise.all([
        contractManager.isRegistered(loginState.userAddress),
        contractManager.getUserStats(loginState.userAddress),
        contractManager.getGlobalStats(),
        contractManager.canAttemptLogin()
      ]);
      
      console.log('User status results:', {
        isRegistered,
        userStats,
        globalStats,
        canAttemptLogin
      });
      
      // Debug: Log the user address being checked
      console.log('Checking address:', loginState.userAddress);
      console.log('Expected address: 0xEf01b1B33F56607fF932C7E057308acaB0E8C52B');
      console.log('Addresses match:', loginState.userAddress?.toLowerCase() === '0xEf01b1B33F56607fF932C7E057308acaB0E8C52B'.toLowerCase());
      
      setLoginState(prev => ({
        ...prev,
        isRegistered,
        userStats,
        globalStats,
        canAttemptLogin: canAttemptLogin.canAttempt,
        loginReason: canAttemptLogin.reason
      }));
    } catch (error) {
      console.error('Error checking user status:', error);
      toast.error('Failed to check user status');
    }
  }, [contractManager, loginState.userAddress]);

  // Check if wallet is connected and user is registered
  useEffect(() => {
    if (contractManager && loginState.isConnected && loginState.userAddress) {
      checkUserStatus();
    }
  }, [contractManager, loginState.isConnected, loginState.userAddress, checkUserStatus]);

  const connectWallet = async () => {
    if (!contractManager) {
      toast.error('Contract manager not initialized');
      return;
    }

    try {
      setLoading(true);
      const address = await contractManager.connectWallet();
      
      setLoginState(prev => ({
        ...prev,
        isConnected: true,
        userAddress: address
      }));
      
      toast.success('Wallet connected successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setLoginState({
      isConnected: false,
      isRegistered: false,
      isLoggedIn: false,
      userAddress: undefined,
      userStats: undefined,
      globalStats: undefined,
      canAttemptLogin: true,
      loginReason: undefined
    });
    toast.success('Wallet disconnected');
  };

  const handleRegister = async (password: string) => {
    if (!contractManager) {
      toast.error('Contract manager not initialized');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Registering user...', { id: 'register' });
      
      // Hash the password
      const hashedPassword = poseidonHash(password);
      console.log('Password hash:', hashedPassword);
      
      // Register the user
      console.log('Calling contract register...');
      await contractManager.register(hashedPassword);
      console.log('Registration transaction completed');
      
      toast.success('Registration successful!', { id: 'register' });
      
      // Wait a moment for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Checking user status...');
      
      // Debug: Check registration status directly
      try {
        const directCheck = await contractManager.isRegistered(loginState.userAddress!);
        console.log('Direct registration check:', directCheck);
        
        if (directCheck) {
          console.log('✅ Registration verified directly!');
        } else {
          console.log('❌ Registration not found in direct check');
        }
      } catch (error) {
        console.error('Direct check failed:', error);
      }
      
      await checkUserStatus(); // Refresh user status
      console.log('User status checked');
      
      setActiveTab('login');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage, { id: 'register' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (password: string): Promise<LoginAttemptResult> => {
    if (!contractManager || !loginState.userAddress) {
      return {
        success: false,
        message: 'Contract manager not initialized',
        canRetry: false
      };
    }

    try {
      setLoading(true);
      toast.loading('Generating ZK proof...', { id: 'login' });
      
      // Get stored hash for the user
      const storedHash = await contractManager.getStoredHash(loginState.userAddress);
      console.log('Stored hash from contract:', storedHash);
      
      // Hash the password to compare (for debugging)
      const hashedPassword = poseidonHash(password);
      console.log('Hashed password:', hashedPassword);
      console.log('Hashes match:', hashedPassword === storedHash);
      
      // Generate ZK proof
      const { proof, publicSignals } = await generateZKProof({
        password,
        storedHash
      });
      
      toast.loading('Verifying proof on-chain...', { id: 'login' });
      
      // Format proof for contract
      const formattedProof = formatProofForContract(proof);
      const publicInputs = publicSignals;
      
      // Call login function
      const result = await contractManager.login(formattedProof, publicInputs);
      
      if (result.success) {
        setLoginState(prev => ({
          ...prev,
          isLoggedIn: true
        }));
        toast.success('Login successful!', { id: 'login' });
        await checkUserStatus(); // Refresh user stats
      } else {
        toast.error(result.message, { id: 'login' });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage, { id: 'login' });
      return {
        success: false,
        message: errorMessage,
        canRetry: true
      };
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    if (!contractManager) {
      toast.error('Contract manager not initialized');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Changing password...', { id: 'change-password' });
      
      // Hash the new password
      const newHashedPassword = poseidonHash(newPassword);
      
      // Change password
      await contractManager.changePassword(newHashedPassword);
      
      toast.success('Password changed successfully!', { id: 'change-password' });
      await checkUserStatus(); // Refresh user status
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      toast.error(errorMessage, { id: 'change-password' });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!loginState.isConnected) {
      return (
        <div className="welcome-section">
          <div className="welcome-card">
            <Shield className="welcome-icon" size={64} />
            <h1>zkSync Era ZKP Login</h1>
            <p>Zero-Knowledge Password Authentication</p>
            <button 
              onClick={connectWallet} 
              disabled={loading}
              className="connect-button"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="icon" size={20} />
                  Connect Wallet
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>zkSync Era ZKP Login</h1>
            <p>Zero-Knowledge Password Authentication</p>
          </div>
          <div className="header-right">
            <button onClick={disconnectWallet} className="disconnect-button">
              <LogOut className="icon" size={16} />
              Disconnect
            </button>
          </div>
        </div>

        <div className="status-section">
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Connected:</span>
              <span className={`status-value ${loginState.isConnected ? 'success' : 'error'}`}>
                {loginState.isConnected ? '✅' : '❌'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Registered:</span>
              <span className={`status-value ${loginState.isRegistered ? 'success' : 'error'}`}>
                {loginState.isRegistered ? '✅' : '❌'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Logged In:</span>
              <span className={`status-value ${loginState.isLoggedIn ? 'success' : 'error'}`}>
                {loginState.isLoggedIn ? '✅' : '❌'}
              </span>
            </div>
            {loginState.userAddress && (
              <div className="status-item">
                <span className="status-label">Address:</span>
                <span className="status-value">
                  {loginState.userAddress.slice(0, 6)}...{loginState.userAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            <Shield className="icon" size={16} />
            Login
          </button>
          <button
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <Settings className="icon" size={16} />
            Register
          </button>
          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <Activity className="icon" size={16} />
            Statistics
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'login' && (
            <div className="login-section">
              {!loginState.isRegistered ? (
                <div className="info-message">
                  <p>You need to register first before you can login.</p>
                  <button 
                    onClick={() => setActiveTab('register')}
                    className="switch-tab-button"
                  >
                    Go to Registration
                  </button>
                </div>
              ) : (
                <LoginForm
                  onSubmit={handleLogin}
                  loading={loading}
                  canAttemptLogin={loginState.canAttemptLogin}
                  loginReason={loginState.loginReason}
                />
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="register-section">
              {loginState.isRegistered ? (
                <div className="info-message">
                  <p>You are already registered. You can change your password here.</p>
                  <RegistrationForm
                    onSubmit={handleChangePassword}
                    loading={loading}
                  />
                </div>
              ) : (
                <RegistrationForm
                  onSubmit={handleRegister}
                  loading={loading}
                />
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-section">
              <UserStats
                userStats={loginState.userStats}
                globalStats={loginState.globalStats}
                userAddress={loginState.userAddress}
              />
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>How it works:</h3>
          <ol>
            <li>Connect your wallet to zkSync Era</li>
            <li>Register with a password (stored as hash)</li>
            <li>Login using ZK proof (password never revealed)</li>
            <li>Change password anytime with new ZK proof</li>
          </ol>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      {renderContent()}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;
