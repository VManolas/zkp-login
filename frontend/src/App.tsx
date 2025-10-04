import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Wallet, LogOut, Settings, Shield, Activity, Crown } from 'lucide-react';
import { ContractManager } from './utils/contracts';
import { generateZKProof, formatProofForContract } from './utils/zkProof';
import { poseidonHash } from './utils/poseidon';
import { ethers } from 'ethers';
import { LoginState, ContractAddresses, LoginAttemptResult } from './types';
import { LoginForm } from './components/LoginForm';
import { RegistrationForm } from './components/RegistrationForm';
import { UserStats } from './components/UserStats';
import { DebugPanel } from './components/DebugPanel';
import { AdminPanel } from './components/AdminPanel';
import { CooldownTimer } from './components/CooldownTimer';
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
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'stats' | 'admin'>('login');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<any>(null);
  const isCheckingRef = useRef(false);
  const lastCheckedRef = useRef<string | null>(null);

  // Initialize contract manager
  useEffect(() => {
    const manager = new ContractManager(CONTRACT_ADDRESSES);
    setContractManager(manager);
  }, []);

  const checkUserStatus = useCallback(async () => {
    if (!contractManager || !loginState.userAddress || isCheckingRef.current) {
      console.log('Cannot check user status: contractManager, userAddress missing, or already checking');
      return;
    }

    // Prevent checking the same address multiple times in quick succession
    if (lastCheckedRef.current === loginState.userAddress) {
      console.log('Already checked this address recently, skipping');
      return;
    }

    try {
      isCheckingRef.current = true;
      setLoading(true);
      console.log('Checking user status for address:', loginState.userAddress);
      const [isRegistered, userStats, globalStats, canAttemptLogin, adminStatus, cooldownData] = await Promise.all([
        contractManager.isRegistered(loginState.userAddress),
        contractManager.getUserStats(loginState.userAddress),
        contractManager.getGlobalStats(),
        contractManager.canAttemptLogin(),
        contractManager.isAdmin(),
        contractManager.getLoginCooldownInfo(loginState.userAddress)
      ]);
      
      console.log('User status results:', {
        isRegistered,
        userStats,
        globalStats,
        canAttemptLogin,
        adminStatus,
        cooldownData
      });
      
      // Debug: Log the registration status specifically
      console.log('🔍 Registration status check:', {
        userAddress: loginState.userAddress,
        isRegistered: isRegistered,
        shouldShowLogin: isRegistered,
        currentTab: activeTab
      });
      
      // Debug: Log the user address being checked
      console.log('Checking address:', loginState.userAddress);
      console.log('Expected address: 0xEf01b1B33F56607fF932C7E057308acaB0E8C52B');
      console.log('Addresses match:', loginState.userAddress?.toLowerCase() === '0xEf01b1B33F56607fF932C7E057308acaB0E8C52B'.toLowerCase());
      
      setIsAdmin(adminStatus);
      setCooldownInfo(cooldownData);
      
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
    } finally {
      isCheckingRef.current = false;
      setLoading(false);
      lastCheckedRef.current = loginState.userAddress;
      
      // Reset the last checked ref after 5 seconds to allow re-checking if needed
      setTimeout(() => {
        lastCheckedRef.current = null;
      }, 5000);
    }
  }, [contractManager, loginState.userAddress]);

  // Check if wallet is connected and user is registered
  useEffect(() => {
    if (contractManager && loginState.isConnected && loginState.userAddress && !isCheckingRef.current) {
      checkUserStatus();
    }
  }, [contractManager, loginState.isConnected, loginState.userAddress]);

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
      
      // Check if user is already registered first
      if (loginState.isRegistered) {
        toast.error('User is already registered. Use the password change feature instead.', { id: 'register' });
        return;
      }
      
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
      
      // Handle specific contract errors
      if (errorMessage.includes('User already registered')) {
        toast.error('User is already registered. Please login or change your password.', { id: 'register' });
        // Force update the login state to show as registered
        console.log('User is already registered, forcing UI update...');
        setLoginState(prev => ({
          ...prev,
          isRegistered: true
        }));
        // Refresh user status to get full data
        await checkUserStatus();
        // Switch to login tab since user is registered
        setActiveTab('login');
      } else {
        toast.error(errorMessage, { id: 'register' });
      }
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
      const hashesMatch = hashedPassword === storedHash;
      
      console.log('🔐 Password verification debug:', {
        inputPassword: password,
        hashedPassword: hashedPassword,
        storedHash: storedHash,
        hashesMatch: hashesMatch
      });
      
      // Prepare circuit input for debugging
      const passwordBytes = ethers.toUtf8Bytes(password);
      const passwordBigInt = BigInt(ethers.hexlify(passwordBytes));
      const circuitInput = {
        password: passwordBigInt.toString(),
        storedHash: storedHash
      };
      
      // Generate ZK proof
      console.log('🔄 Starting ZK proof generation...');
      const { proof, publicSignals } = await generateZKProof({
        password,
        storedHash
      });
      
      // Store debug information
      setDebugInfo({
        password: password,
        storedHash: storedHash,
        hashedPassword: hashedPassword,
        hashesMatch: hashesMatch,
        circuitInput: circuitInput,
        publicSignals: publicSignals,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        networkInfo: contractManager?.getCurrentNetworkInfo(),
        contractInfo: {
          verifier: CONTRACT_ADDRESSES.verifier,
          loginAuth: CONTRACT_ADDRESSES.loginAuth
        }
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
      
      // Store debug information even on error
      if (loginState.userAddress) {
        try {
          const storedHash = await contractManager.getStoredHash(loginState.userAddress);
          const hashedPassword = poseidonHash(password);
          const passwordBytes = ethers.toUtf8Bytes(password);
          const passwordBigInt = BigInt(ethers.hexlify(passwordBytes));
          
          setDebugInfo({
            password: password,
            storedHash: storedHash,
            hashedPassword: hashedPassword,
            hashesMatch: hashedPassword === storedHash,
            circuitInput: {
              password: passwordBigInt.toString(),
              storedHash: storedHash
            },
            publicSignals: [],
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            networkInfo: contractManager?.getCurrentNetworkInfo(),
            contractInfo: {
              verifier: CONTRACT_ADDRESSES.verifier,
              loginAuth: CONTRACT_ADDRESSES.loginAuth
            },
            error: {
              message: errorMessage,
              stack: error instanceof Error ? error.stack : undefined,
              type: 'login_error'
            }
          });
        } catch (debugError) {
          console.warn('Failed to collect debug info on error:', debugError);
        }
      }
      
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
          {isAdmin && (
            <button
              className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Crown className="icon" size={16} />
              Admin
            </button>
          )}
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
                <>
                  <CooldownTimer
                    cooldownInfo={cooldownInfo}
                    onCooldownComplete={checkUserStatus}
                  />
                  <LoginForm
                    onSubmit={handleLogin}
                    loading={loading}
                    canAttemptLogin={loginState.canAttemptLogin}
                    loginReason={loginState.loginReason}
                  />
                </>
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

          {activeTab === 'admin' && (
            <div className="admin-section">
              <AdminPanel
                contractManager={contractManager}
                userAddress={loginState.userAddress}
                onUserRemoved={checkUserStatus}
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
          
          <div className="warning-info">
            <h4>⚠️ Console Warnings</h4>
            <p>
              You may see RPC warnings in the browser console about "eth_maxPriorityFeePerGas" not being available. 
              This is normal for zkSync Era as it doesn't support EIP-1559 gas pricing. These warnings can be safely ignored 
              and don't affect the functionality of the application.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      {renderContent()}
      
      {debugInfo && (
        <DebugPanel
          debugInfo={debugInfo}
          onClose={() => setDebugInfo(null)}
        />
      )}
      
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
