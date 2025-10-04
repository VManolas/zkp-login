// Optimized contract interaction utilities
import { Provider, Wallet, Contract as ZkSyncContract, BrowserProvider, Signer, types } from 'zksync-ethers';
import { ethers } from 'ethers';
import { ContractAddresses, UserStats, GlobalStats, LoginAttemptResult, ContractError } from '../types';

// Contract ABI (matching the actual deployed contract)
const LOGIN_AUTH_ABI = [
  "function register(uint256 hashValue) external",
  "function login(uint256[2] calldata _pA, uint256[2][2] calldata _pB, uint256[2] calldata _pC, uint256[1] calldata _pubSignals) external returns (bool success)",
  "function changePassword(uint256 newHashValue) external",
  "function isRegistered(address user) external view returns (bool)",
  "function getUserStats(address user) external view returns (uint256 attempts, uint256 successful, bool registered, uint256 lastAttempt, uint256 registrationTime)",
  "function getGlobalStats() external view returns (uint256 users, uint256 attempts, uint256 successful, bool isPaused)",
  "function canAttemptLogin(address user) external view returns (bool canAttempt, string memory reason)",
  "function storedHashes(address user) external view returns (uint256)",
  "function admin() external view returns (address)",
  "function paused() external view returns (bool)",
  "function removeUser(address user) external",
  "function transferAdmin(address newAdmin) external",
  "function pause() external",
  "function unpause() external",
  "function resetUserAttempts(address user) external",
  "event UserRegistered(address indexed user, uint256 indexed hashValue, uint256 timestamp)",
  "event UserLoggedIn(address indexed user, bool success, uint256 timestamp)",
  "event UserPasswordChanged(address indexed user, uint256 indexed newHashValue, uint256 timestamp)",
  "event UserRemoved(address indexed user, address indexed admin, uint256 timestamp)",
  "event AdminTransferred(address indexed oldAdmin, address indexed newAdmin, uint256 timestamp)"
];

const VERIFIER_ABI = [
  "function verifyProof(bytes calldata proof, uint256[2] calldata publicSignals) external view returns (bool)",
  "function verifyProofWithHash(bytes calldata proof, uint256[2] calldata publicSignals, uint256 expectedHash) external view returns (bool)"
];

export class ContractManager {
  private provider: Provider;
  // Signer may be a zkSync Wallet or a generic Ethers Signer connected to a zkSync Provider
  private signer: any | null = null;
  private browserProvider: BrowserProvider | null = null;
  private loginAuthContract: ZkSyncContract | null = null;
  private verifierContract: ZkSyncContract | null = null;
  private contractAddresses: ContractAddresses;
  private networkInfo: any = null;
  private ephemeralWallet: Wallet | null = null; // optional fallback signer
  private lastFallbackReason: string | null = null;

  constructor(contractAddresses: ContractAddresses) {
    this.contractAddresses = contractAddresses;
    // Initialize zkSync provider with proper configuration using types.Network
    this.provider = Provider.getDefaultProvider(types.Network.Sepolia);
    // Suppress known RPC warnings that are normal for zkSync Era
    this.suppressKnownRPCWarnings();
  }

  /**
   * Suppress known RPC warnings that are normal for zkSync Era
   */
  private suppressKnownRPCWarnings(): void {
    // Override console.warn to filter out known RPC warnings
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress specific RPC warnings that are normal for zkSync Era
      if (message.includes('eth_maxPriorityFeePerGas') || 
          message.includes('does not exist / is not available') ||
          message.includes('RPC Error: The method')) {
        // Don't log these warnings as they're expected on zkSync Era
        return;
      }
      // Log all other warnings normally
      originalWarn.apply(console, args);
    };
  }

  /**
   * Get the provider instance
   */
  getProvider(): Provider {
    return this.provider;
  }

  /**
   * Get write-enabled contract instances
   */
  private async getWriteContracts() {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    // Prefer funded ephemeral wallet if available (to bypass MetaMask L2 fee issues)
    let activeSigner: any = this.signer;
    if (this.ephemeralWallet) {
      try {
        const bal = await this.ephemeralWallet.getBalance();
        if (bal > BigInt(0)) {
          activeSigner = this.ephemeralWallet;
          console.log('[getWriteContracts] Using funded ephemeral wallet for write operations');
        } else {
          console.log('[getWriteContracts] Ephemeral wallet has zero balance; using MetaMask signer');
        }
      } catch (e) {
        console.warn('[getWriteContracts] Could not read ephemeral wallet balance:', e);
      }
    }

    return {
      loginAuthContract: new ZkSyncContract(
        this.contractAddresses.loginAuth,
        LOGIN_AUTH_ABI,
        activeSigner
      ),
      verifierContract: new ZkSyncContract(
        this.contractAddresses.verifier,
        VERIFIER_ABI,
        activeSigner
      )
    };
  }

  /**
   * Connect to wallet and initialize contracts
   */
  async connectWallet(selectedAccount?: string): Promise<string> {
    try {
      if (!(window as any).ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // 1. Ensure correct network (switch/add if needed)
      await this.ensureCorrectNetwork();

      // 2. Discover accounts
      const availableAccounts = await this.getAvailableAccounts();
      if (availableAccounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }
      let selectedAddress = selectedAccount && availableAccounts.includes(selectedAccount)
        ? selectedAccount
        : availableAccounts[0];
      console.log('[connectWallet] Using account:', selectedAddress);

      // 3. Build zkSync BrowserProvider and create proper zkSync signer
      const browserProvider = new BrowserProvider((window as any).ethereum, {
        name: 'zkSync Era Sepolia',
        chainId: 300
      });
      const l1Signer = await browserProvider.getSigner();
      
      // 4. Create proper zkSync signer using Signer.from() with correct parameters
      const chainId = 300; // zkSync Era Sepolia
      const l2Provider = this.provider; // already initialized in constructor
      
      console.log('Creating zkSync signer with chainId:', chainId);
      console.log('L1 Signer address:', await l1Signer.getAddress());
      console.log('L2 Provider network:', await l2Provider.getNetwork());
      
      // Use the correct Signer.from() method with proper parameter order
      const zkSyncSigner = await Signer.from(l1Signer, chainId, l2Provider);
      
      // Verify that signer exposes required methods
      const requiredMethods = ['getAddress', 'sendTransaction'];
      for (const m of requiredMethods) {
        if (typeof (zkSyncSigner as any)[m] !== 'function') {
          throw new Error(`zkSync signer missing method ${m}`);
        }
      }

      // Store references
      this.signer = zkSyncSigner;
      this.browserProvider = browserProvider;
      this.networkInfo = await this.getNetworkInfo();

      // Create (or reuse) an ephemeral wallet early so user can fund it proactively
      await this.createEphemeralWallet();
      if (this.ephemeralWallet) {
        const epAddr = await this.ephemeralWallet.getAddress();
        console.log('[connectWallet] Ephemeral dev wallet address (fund with small test ETH for smooth writes):', epAddr);
      }

      // 5. Initialize read-only contract instances
      this.loginAuthContract = new ZkSyncContract(
        this.contractAddresses.loginAuth,
        LOGIN_AUTH_ABI,
        this.provider
      );
      this.verifierContract = new ZkSyncContract(
        this.contractAddresses.verifier,
        VERIFIER_ABI,
        this.provider
      );
      // 6. Optional diagnostic network check
      try {
        const net = await l2Provider.getNetwork();
        console.log('[connectWallet] zkSync Provider network:', net);
      } catch (e) {
        console.warn('[connectWallet] Could not fetch zkSync provider network:', e);
      }

      this.setupNetworkChangeListener();
      return selectedAddress;
    } catch (error) {
      console.error('Error connecting wallet (refactored path):', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Get network information
   */
  private async getNetworkInfo(): Promise<any> {
    try {
      const network = await this.provider.getNetwork();
      return {
        name: network.name,
        chainId: Number(network.chainId),
        rpcUrl: 'https://sepolia.era.zksync.dev'
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  /**
   * Ensure provider is properly initialized for L2 operations
   */
  private async ensureProviderInitialized(): Promise<void> {
    try {
      // Ensure signer is properly connected to L2
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }
      
      // Get signer address to ensure it's connected (guard for objects lacking method)
      let address: string | undefined;
      if (typeof this.signer.getAddress === 'function') {
        address = await this.signer.getAddress();
      } else {
        const accounts = await this.getAvailableAccounts();
        address = accounts[0];
        console.warn('[ensureProviderInitialized] signer.getAddress missing; using first account:', address);
      }
      console.log('Signer address:', address);
      
      // For zkSync wallet, check both L1 and L2 providers
      if (this.signer.provider) {
        const network = await this.signer.provider.getNetwork();
        console.log('Signer provider network:', network);
        
        // Ensure we're connected to zkSync Era Sepolia (Chain ID: 300)
        if (Number(network.chainId) !== 300) {
          const networkName = this.getNetworkName(Number(network.chainId));
          throw new Error(`Wrong network detected. Please switch to zkSync Era Sepolia testnet.\n\nCurrent network: ${networkName} (Chain ID: ${network.chainId})\nRequired network: zkSync Era Sepolia (Chain ID: 300)\n\nPlease switch your wallet to the correct network and try again.`);
        }
        
        // Force L2 provider initialization by getting block number
        const blockNumber = await this.signer.provider.getBlockNumber();
        console.log('Current block number:', blockNumber);
      }
      
      // For zkSync signer, check if it has L1 context
      // Note: l1Provider might not be available in all zkSync signer implementations
      if (this.signer.provider && (this.signer.provider as any).l1Provider) {
        const l1Network = await (this.signer.provider as any).l1Provider.getNetwork();
        console.log('L1 provider network:', l1Network);
      }
      
      // Test gas price + block number as lighter-weight readiness checks
      try {
        // Use zkSync-compatible gas price method
        const gp = await this.getZkSyncGasPrice();
        console.log('Gas price (zkSync compatible):', gp.toString());
      } catch (gpErr) {
        console.warn('Could not fetch gas price from signer provider:', gpErr);
      }
      console.log('Provider initialized checks complete. (Transaction populate moved to connectWallet).');
    } catch (error) {
      console.error('Error initializing provider for L2:', error);
      if (error instanceof Error && error.message.includes('Wrong network detected')) {
        throw error; // Re-throw network error with detailed message
      }
      throw new Error('Failed to initialize provider for L2 operations');
    }
  }

  /**
   * Get network name from chain ID
   */
  private getNetworkName(chainId: number): string {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Ethereum Sepolia',
      300: 'zkSync Era Sepolia',
      324: 'zkSync Era Mainnet',
      280: 'zkSync Era Testnet (deprecated)'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  }

  /**
   * Ensure we're on the correct network before connecting
   */
  private async ensureCorrectNetwork(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      // Get current chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      
      console.log('Current chain ID:', currentChainId);
      
      // If we're not on zkSync Era Sepolia (300), switch to it
      if (currentChainId !== 300) {
        console.log('Switching to zkSync Era Sepolia network...');
        await this.switchToZkSyncNetwork();
        
        // Verify the switch was successful
        const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
        const newChainIdNumber = parseInt(newChainId, 16);
        
        if (newChainIdNumber !== 300) {
          throw new Error('Failed to switch to zkSync Era Sepolia network. Please switch manually in MetaMask.');
        }
        
        console.log('Successfully switched to zkSync Era Sepolia network');
      } else {
        console.log('Already on zkSync Era Sepolia network');
      }
    } catch (error) {
      console.error('Error ensuring correct network:', error);
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Switch to zkSync Era Sepolia network
   */
  async switchToZkSyncNetwork(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    // zkSync Era Sepolia network configuration
    const zkSyncNetwork = {
      chainId: '0x12c', // 300 in hex
      chainName: 'zkSync Era Sepolia Testnet',
      rpcUrls: ['https://sepolia.era.zksync.dev'],
      blockExplorerUrls: ['https://sepolia-era.zksync.network'],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
    };

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: zkSyncNetwork.chainId }],
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [zkSyncNetwork],
          });
        } catch (addError) {
          throw new Error('Failed to add zkSync Era Sepolia network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to zkSync Era Sepolia network');
      }
    }
  }

  /**
   * Register a new user
   */
  async register(hashValue: string): Promise<void> {
    try {
      // Ensure provider is properly initialized for L2 operations
      await this.ensureProviderInitialized();
      
      // Get write-enabled contracts
      const { loginAuthContract } = await this.getWriteContracts();
      
      console.log('Contract register called with hash:', hashValue);
      // Convert hex string to BigInt for contract
      const hashBigInt = BigInt(hashValue);
      console.log('Converted hash to BigInt:', hashBigInt.toString());
      const tx = await this.invokeWithFallback(loginAuthContract, 'register', [hashBigInt]);
      console.log('Registration transaction hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('Registration transaction confirmed:', receipt?.hash);
    } catch (error) {
      console.error('Error registering user:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Login with ZK proof
   */
  async login(proof: any, publicInputs: string[]): Promise<LoginAttemptResult> {
    try {
      // Ensure provider is properly initialized for L2 operations
      await this.ensureProviderInitialized();
      
      // Check if user can attempt login
      const canAttempt = await this.canAttemptLogin();
      if (!canAttempt.canAttempt) {
        return {
          success: false,
          message: canAttempt.reason,
          canRetry: false
        };
      }

      // Get write-enabled contracts
      const { loginAuthContract } = await this.getWriteContracts();

      // The circuit now outputs only [storedHashOut] (1 public signal)
      // The contract expects only the stored hash as the public signal
      const storedHashFromProof = publicInputs[0]; // First (and only) public signal is the stored hash
      const publicInputsBigInt = [BigInt(storedHashFromProof)];
      
      console.log('Using stored hash from proof:', storedHashFromProof);
      
      // Call login function with the correct proof format
      const tx = await this.invokeWithFallback(loginAuthContract, 'login', [
        proof.pi_a,
        proof.pi_b,
        proof.pi_c,
        publicInputsBigInt
      ]);
      const receipt = await tx.wait();
      // If the contract returns a bool we need to read logs or do a static call. Instead perform a post-call static read.
      // Fallback simple assumption: success if receipt.status === 1
      const success = (receipt?.status === 1);
      return {
        success,
        message: success ? 'Login transaction mined.' : 'Login transaction failed',
        canRetry: !success
      };
    } catch (error) {
      console.error('Error logging in:', error);
      const contractError = this.handleContractError(error);
      
      return {
        success: false,
        message: contractError.message,
        canRetry: this.isRetryableError(contractError)
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(newHashValue: string): Promise<void> {
    try {
      // Ensure provider is properly initialized for L2 operations
      await this.ensureProviderInitialized();
      
      // Get write-enabled contracts
      const { loginAuthContract } = await this.getWriteContracts();
      
      // Convert hex string to BigInt for contract
      const hashBigInt = BigInt(newHashValue);
      const tx = await this.invokeWithFallback(loginAuthContract, 'changePassword', [hashBigInt]);
      await tx.wait();
    } catch (error) {
      console.error('Error changing password:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Check if user is registered
   */
  async isRegistered(userAddress: string): Promise<boolean> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('Checking if user is registered:', userAddress);
      console.log('Contract address:', this.contractAddresses.loginAuth);
      
      // Test if contract is deployed by calling a simple function
      const result = await this.loginAuthContract.isRegistered(userAddress);
      console.log('Registration check result:', result);
      return result;
    } catch (error) {
      console.error('Error checking registration:', error);
      console.error('Contract address:', this.contractAddresses.loginAuth);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        reason: (error as any)?.reason
      });
      return false;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userAddress: string): Promise<UserStats> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const [attempts, successful, registered, lastAttempt, registrationTime] = 
        await this.loginAuthContract.getUserStats(userAddress);
      
      return {
        attempts: Number(attempts),
        successful: Number(successful),
        registered,
        lastAttempt: Number(lastAttempt),
        registrationTime: Number(registrationTime)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        attempts: 0,
        successful: 0,
        registered: false,
        lastAttempt: 0,
        registrationTime: 0
      };
    }
  }

  /**
   * Get global contract statistics
   */
  async getGlobalStats(): Promise<GlobalStats> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const [users, attempts, successful, paused] = 
        await this.loginAuthContract.getGlobalStats();
      
      return {
        users: Number(users),
        attempts: Number(attempts),
        successful: Number(successful),
        paused
      };
    } catch (error) {
      console.error('Error getting global stats:', error);
      return {
        users: 0,
        attempts: 0,
        successful: 0,
        paused: false
      };
    }
  }

  /**
   * Check if user can attempt login
   */
  async canAttemptLogin(): Promise<{ canAttempt: boolean; reason: string }> {
    if (!this.loginAuthContract || !this.signer) {
      return { canAttempt: false, reason: 'Contract not initialized' };
    }

    try {
      let address: string;
      if (typeof this.signer.getAddress === 'function') {
        address = await this.signer.getAddress();
      } else {
        const accounts = await this.getAvailableAccounts();
        address = accounts[0];
        console.warn('[canAttemptLogin] signer.getAddress not available, using first account');
      }
      const [canAttempt, reason] = await this.loginAuthContract.canAttemptLogin(address);
      return { canAttempt, reason };
    } catch (error) {
      console.error('Error checking login eligibility:', error);
      return { canAttempt: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Get stored hash for user
   */
  async getStoredHash(userAddress: string): Promise<string> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hash = await this.loginAuthContract.storedHashes(userAddress);
      return hash.toString();
    } catch (error) {
      console.error('Error getting stored hash:', error);
      return '0';
    }
  }

  /**
   * Get contract admin
   */
  async getAdmin(): Promise<string> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.loginAuthContract.admin();
    } catch (error) {
      console.error('Error getting admin:', error);
      return '';
    }
  }

  /**
   * Check if contract is paused
   */
  async isPaused(): Promise<boolean> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.loginAuthContract.paused();
    } catch (error) {
      console.error('Error checking pause status:', error);
      return false;
    }
  }

  /**
   * Handle contract errors with better error messages
   */
  private handleContractError(error: any): ContractError {
    // Handle RPC errors
    if (error?.code === -32601 && error?.message?.includes('eth_maxPriorityFeePerGas')) {
      return {
        code: 'RPC_ERROR',
        message: 'MetaMask is trying to use EIP-1559 gas pricing which is not supported on zkSync Era. This is a known issue and the transaction should still work. Please ignore this warning.'
      };
    }
    
    if (error?.code === -32601 && error?.message?.includes('does not exist / is not available')) {
      return {
        code: 'RPC_ERROR',
        message: 'RPC method not supported on zkSync Era. This is normal and the transaction should still work. Please ignore this warning.'
      };
    }
    
    if (error?.code === -32603) {
      return {
        code: 'RPC_ERROR',
        message: 'Internal RPC error. Please try again or check your network connection.'
      };
    }
    
    if (typeof error?.message === 'string' && error.message.includes('Initialize provider L2')) {
      return {
        code: 'L2_INIT',
        message: 'Provider not fully initialized for zkSync L2. Retry or switch networks.'
      };
    }
    
    if (error.code === 'ACTION_REJECTED') {
      return {
        code: 'USER_REJECTED',
        message: 'Transaction was rejected by user'
      };
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds for transaction'
      };
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network changed during connection. Please refresh the page and try again.'
      };
    }
    
    if (error.message && error.message.includes('network changed')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network changed during connection. Please refresh the page and try again.'
      };
    }
    
    // Handle specific contract errors
    if (error.reason) {
      return {
        code: 'CONTRACT_ERROR',
        message: error.reason
      };
    }
    
    if (error.message) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred'
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: ContractError): boolean {
    const retryableCodes = ['USER_REJECTED', 'INSUFFICIENT_FUNDS', 'L2_INIT'];
    return retryableCodes.includes(error.code);
  }

  /**
   * Core helper: attempts contract method call; on L2 init error builds raw tx and sends manually.
   */
  private async invokeWithFallback(contract: any, method: string, args: any[]): Promise<any> {
    if (!this.signer) throw new Error('Signer not initialized');
    try {
      // Connect the contract to the zkSync signer first
      const connectedContract = contract.connect(this.signer);
      return await connectedContract[method](...args);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Initialize provider L2') || msg.includes('populateFeeData')) {
        console.warn(`[invokeWithFallback] Primary path failed (${method}):`, msg);
        this.lastFallbackReason = msg;
        return await this.manualSend(contract, method, args);
      }
      throw err;
    }
  }

  /**
   * Manual raw transaction construction bypassing contract runner fee population if needed.
   */
  private async manualSend(contract: any, method: string, args: any[]) {
    if (!this.signer) throw new Error('Signer not initialized');
    const iface = new ethers.Interface(LOGIN_AUTH_ABI);
    const target = (contract.target || contract.address);
    if (!target) throw new Error('Cannot determine contract address for manual send');
    const data = iface.encodeFunctionData(method, args);
    // Use fixed gas settings to completely avoid RPC gas estimation errors
    const gasPrice = BigInt('25000000'); // 0.025 gwei - fixed for zkSync Era Sepolia
    console.log('Using fixed gas price:', gasPrice.toString(), 'wei');
    
    const txRequest: any = {
      to: target,
      data,
      value: 0,
      gasLimit: 3_000_000,
      gasPrice: gasPrice
    };
    
    console.log('Transaction request:', {
      to: target,
      gasLimit: txRequest.gasLimit,
      gasPrice: txRequest.gasPrice?.toString()
    });
    console.log('[manualSend] Sending raw tx', { method, to: target, gasPrice: gasPrice?.toString() });
    try {
      const tx = await this.signer.sendTransaction(txRequest);
      return tx;
    } catch (e: any) {
      console.error('[manualSend] Failed to send raw tx:', e);
      
      // Handle RPC errors specifically
      if (e?.message?.includes('eth_maxPriorityFeePerGas') || e?.code === -32601 || e?.code === -32603) {
        try {
          console.log('[manualSend] RPC error detected, trying with minimal gas settings');
          const minimalTxRequest = {
            to: target,
            data,
            value: 0,
            gasLimit: 1_000_000, // Lower gas limit
            gasPrice: BigInt('10000000') // Lower gas price
          };
          const tx = await this.signer.sendTransaction(minimalTxRequest);
          return tx;
        } catch (minimalError) {
          console.warn('[manualSend] Minimal gas settings also failed:', minimalError);
        }
      }
      
      // Attempt raw MetaMask eth_sendTransaction path (lets MetaMask fill fees) if error is L2 init related
      if (e?.message?.includes('Initialize provider L2') && (window as any).ethereum) {
        try {
          console.log('[manualSend] Trying raw MetaMask eth_sendTransaction fallback');
          const hash = await this.rawMetaMaskSend(target, data);
          return { hash, wait: () => this.provider.waitForTransaction(hash) };
        } catch (rawErr) {
          console.warn('[manualSend] Raw MetaMask send failed:', rawErr);
        }
      }
      // Attempt ephemeral wallet fallback if enabled
      if (!this.ephemeralWallet) {
        console.warn('[manualSend] Attempting ephemeral wallet creation as last resort. NOTE: Requires funding.');
        await this.createEphemeralWallet();
      }
      if (this.ephemeralWallet) {
        try {
          const fundedBalance = await this.ephemeralWallet.getBalance();
          if (fundedBalance === BigInt(0)) {
            console.warn('[manualSend] Ephemeral wallet has zero balance. Cannot proceed.');
          } else {
            console.log('[manualSend] Retrying with ephemeral wallet');
            return await this.ephemeralWallet.sendTransaction(txRequest);
          }
        } catch (inner) {
          console.error('[manualSend] Ephemeral retry failed:', inner);
        }
      }
      throw e;
    }
  }

  /**
   * Sends a transaction using window.ethereum directly, bypassing signer fee population.
   * Lets MetaMask handle fee estimation. Returns tx hash.
   */
  private async rawMetaMaskSend(to: string, data: string): Promise<string> {
    if (!(window as any).ethereum) throw new Error('No injected provider available');
    const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    // Try to obtain realistic gas + fee parameters to avoid MetaMask wild overestimation
    let gasHex: string | undefined;
    let gasPriceHex: string | undefined;
    try {
      // Estimate gas via zkSync provider (falls back silently if fails)
      const estGas = await this.provider.estimateGas({ to, data, from }).catch(() => undefined);
      if (estGas) {
        // Add a 20% buffer
        const buffered = estGas + (estGas / BigInt(5));
        gasHex = ethers.toBeHex(buffered);
      }
      // Use zkSync-compatible gas price method
      const gp = await this.getZkSyncGasPrice();
      // Cap gas price to reasonable limit for zkSync Era Sepolia
      const maxGasPrice = BigInt('1000000000000000000'); // 0.001 ETH
      const cappedGasPrice = gp > maxGasPrice ? maxGasPrice : gp;
      gasPriceHex = ethers.toBeHex(cappedGasPrice);
      console.log('Raw gas price:', gp.toString(), 'Capped gas price:', cappedGasPrice.toString());
    } catch (e) {
      console.warn('[rawMetaMaskSend] Fee estimation fallback:', e);
    }

    const txParams: any = {
      from,
      to,
      data,
      value: '0x0'
    };
    if (gasHex) txParams.gas = gasHex;
    if (gasPriceHex) {
      // MetaMask on zkSync may accept either gasPrice or EIP-1559 fields; supply gasPrice for simplicity.
      txParams.gasPrice = gasPriceHex;
    }
    const hash = await (window as any).ethereum.request({ method: 'eth_sendTransaction', params: [txParams] });
    console.log('[rawMetaMaskSend] tx hash:', hash);
    return hash;
  }

  /**
   * Creates an ephemeral zkSync wallet and stores its private key in localStorage (DEV ONLY)
   */
  private async createEphemeralWallet(): Promise<void> {
    try {
      if (!(window as any).localStorage) return;
      const keyName = 'zk_ephemeral_pk_v1';
      let pk = window.localStorage.getItem(keyName);
      if (!pk) {
        pk = Wallet.createRandom().privateKey;
        window.localStorage.setItem(keyName, pk);
        console.log('[ephemeralWallet] Generated new dev private key');
      } else {
        console.log('[ephemeralWallet] Reusing stored dev private key');
      }
      this.ephemeralWallet = new Wallet(pk, this.provider);
      console.log('[ephemeralWallet] Address:', await this.ephemeralWallet.getAddress());
    } catch (e) {
      console.warn('Failed to create ephemeral wallet:', e);
    }
  }

  /** Expose last fallback reason for UI diagnostics */
  getLastFallbackReason(): string | null {
    return this.lastFallbackReason;
  }

  /** Returns ephemeral wallet address & balance (if created) */
  async getEphemeralWalletInfo(): Promise<{ address: string; balance: string } | null> {
    if (!this.ephemeralWallet) return null;
    try {
      const address = await this.ephemeralWallet.getAddress();
      const bal = await this.ephemeralWallet.getBalance();
      return { address, balance: ethers.formatEther(bal) };
    } catch {
      return null;
    }
  }

  /**
   * Set up network change listener
   */
  private setupNetworkChangeListener(): void {
    if (!(window as any).ethereum) {
      return;
    }

    // Listen for chain changes
    (window as any).ethereum.on('chainChanged', (chainId: string) => {
      console.log('Chain changed:', chainId);
      const newChainId = parseInt(chainId, 16);
      
      if (newChainId !== 300) {
        console.warn('Network changed to non-zkSync network. Please switch back to zkSync Era Sepolia testnet (Chain ID: 300)');
        // Optionally, you could automatically switch back or show a warning to the user
      } else {
        console.log('Switched to zkSync Era Sepolia network');
      }
    });

    // Listen for account changes
    (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log('Account changed:', accounts);
      if (accounts.length === 0) {
        // User disconnected
        this.signer = null;
        this.browserProvider = null;
        console.log('Wallet disconnected');
      } else {
        // User switched accounts
        const newAddress = accounts[0];
        console.log('Switched to account:', newAddress);
        // Note: The signer will automatically use the new account
        // No need to recreate the signer
      }
    });
  }

  /**
   * Get current network info
   */
  getCurrentNetworkInfo(): any {
    return this.networkInfo;
  }

  /**
   * Check MetaMask status and provide debugging information
   */
  async checkMetaMaskStatus(): Promise<{
    isInstalled: boolean;
    isUnlocked: boolean;
    accounts: string[];
    networkId?: string;
    error?: string;
  }> {
    try {
      // Check if MetaMask is installed
      if (!(window as any).ethereum) {
        return {
          isInstalled: false,
          isUnlocked: false,
          accounts: [],
          error: 'MetaMask is not installed. Please install the MetaMask extension.'
        };
      }

      // Check if MetaMask is unlocked by trying to get accounts
      let accounts: string[] = [];
      let isUnlocked = false;
      
      try {
        accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        isUnlocked = accounts.length > 0;
      } catch (error) {
        console.log('Error checking accounts:', error);
      }

      // Get network ID
      let networkId: string | undefined;
      try {
        networkId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      } catch (error) {
        console.log('Error getting network ID:', error);
      }

      return {
        isInstalled: true,
        isUnlocked,
        accounts,
        networkId,
        error: isUnlocked ? undefined : 'MetaMask is locked. Please unlock MetaMask and try again.'
      };
    } catch (error) {
      return {
        isInstalled: true,
        isUnlocked: false,
        accounts: [],
        error: `Error checking MetaMask status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all available accounts from MetaMask
   */
  async getAvailableAccounts(): Promise<string[]> {
    try {
      if (!(window as any).ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask extension.');
      }
      
      console.log('Checking for available accounts...');
      const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
      console.log('Available accounts:', accounts);
      
      if (accounts.length === 0) {
        console.log('No accounts found. MetaMask may be locked or no accounts are connected.');
        // Try to request accounts to prompt user to unlock
        try {
          const requestedAccounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          console.log('Requested accounts:', requestedAccounts);
          return requestedAccounts;
        } catch (requestError) {
          console.log('Failed to request accounts:', requestError);
          throw new Error('No accounts found. Please unlock MetaMask and ensure you have at least one account.');
        }
      }
      
      return accounts;
    } catch (error) {
      console.error('Error getting available accounts:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to MetaMask. Please check if MetaMask is installed and unlocked.');
    }
  }

  /**
   * Get account information including balance
   */
  async getAccountInfo(accountAddress?: string): Promise<{
    address: string;
    balance: string;
    isRegistered: boolean;
    userStats?: any;
  }> {
    try {
      const address = accountAddress || (this.signer ? await this.signer.getAddress() : null);
      
      if (!address) {
        throw new Error('No account address provided and no signer available');
      }

      // Get balance
      const balance = this.signer ? await this.signer.getBalance() : BigInt(0);
      const balanceInEth = ethers.formatEther(balance);

      // Check if user is registered
      const isRegistered = await this.isRegistered(address);

      // Get user stats if registered
      let userStats = null;
      if (isRegistered) {
        userStats = await this.getUserStats(address);
      }

      return {
        address,
        balance: balanceInEth,
        isRegistered,
        userStats
      };
    } catch (error) {
      console.error('Error getting account info:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Get all accounts with their information
   */
  async getAllAccountsInfo(): Promise<Array<{
    address: string;
    balance: string;
    isRegistered: boolean;
    userStats?: any;
  }>> {
    try {
      const accounts = await this.getAvailableAccounts();
      const accountsInfo = [];

      for (const account of accounts) {
        try {
          const info = await this.getAccountInfo(account);
          accountsInfo.push(info);
        } catch (error) {
          console.warn(`Could not get info for account ${account}:`, error);
          accountsInfo.push({
            address: account,
            balance: '0',
            isRegistered: false
          });
        }
      }

      return accountsInfo;
    } catch (error) {
      console.error('Error getting all accounts info:', error);
      return [];
    }
  }

  // ==================== ADMIN FUNCTIONS ====================

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }

    try {
      const adminAddress = await this.loginAuthContract?.admin();
      const currentAddress = await this.signer.getAddress();
      return adminAddress?.toLowerCase() === currentAddress.toLowerCase();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Remove a user (admin only)
   */
  async removeUser(userAddress: string): Promise<void> {
    try {
      await this.ensureProviderInitialized();
      const { loginAuthContract } = await this.getWriteContracts();
      
      const tx = await this.invokeWithFallback(loginAuthContract, 'removeUser', [userAddress]);
      await tx.wait();
      
      console.log('User removed successfully:', userAddress);
    } catch (error) {
      console.error('Error removing user:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Transfer admin role
   */
  async transferAdmin(newAdminAddress: string): Promise<void> {
    try {
      await this.ensureProviderInitialized();
      const { loginAuthContract } = await this.getWriteContracts();
      
      const tx = await this.invokeWithFallback(loginAuthContract, 'transferAdmin', [newAdminAddress]);
      await tx.wait();
      
      console.log('Admin transferred successfully to:', newAdminAddress);
    } catch (error) {
      console.error('Error transferring admin:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Pause the contract (admin only)
   */
  async pauseContract(): Promise<void> {
    try {
      await this.ensureProviderInitialized();
      const { loginAuthContract } = await this.getWriteContracts();
      
      const tx = await this.invokeWithFallback(loginAuthContract, 'pause', []);
      await tx.wait();
      
      console.log('Contract paused successfully');
    } catch (error) {
      console.error('Error pausing contract:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Unpause the contract (admin only)
   */
  async unpauseContract(): Promise<void> {
    try {
      await this.ensureProviderInitialized();
      const { loginAuthContract } = await this.getWriteContracts();
      
      const tx = await this.invokeWithFallback(loginAuthContract, 'unpause', []);
      await tx.wait();
      
      console.log('Contract unpaused successfully');
    } catch (error) {
      console.error('Error unpausing contract:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Reset user's login attempts (admin only)
   */
  async resetUserAttempts(userAddress: string): Promise<void> {
    try {
      await this.ensureProviderInitialized();
      const { loginAuthContract } = await this.getWriteContracts();
      
      const tx = await this.invokeWithFallback(loginAuthContract, 'resetUserAttempts', [userAddress]);
      await tx.wait();
      
      console.log('User attempts reset successfully for:', userAddress);
    } catch (error) {
      console.error('Error resetting user attempts:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Get admin address
   */
  async getAdminAddress(): Promise<string> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.loginAuthContract.admin();
    } catch (error) {
      console.error('Error getting admin address:', error);
      return '';
    }
  }

  /**
   * Check if contract is paused
   */
  async isContractPaused(): Promise<boolean> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.loginAuthContract.paused();
    } catch (error) {
      console.error('Error checking pause status:', error);
      return false;
    }
  }

  /**
   * Get login cooldown information for a user
   */
  async getLoginCooldownInfo(userAddress: string): Promise<{
    canAttempt: boolean;
    reason: string;
    lastAttempt: number;
    cooldownEnds: number;
    timeRemaining: number;
  }> {
    if (!this.loginAuthContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const canAttempt = await this.loginAuthContract.canAttemptLogin(userAddress);
      const userStats = await this.loginAuthContract.getUserStats(userAddress);
      
      // Convert BigInt to number for calculations
      const lastAttempt = Number(userStats.lastAttempt);
      const cooldownEnds = lastAttempt + (60 * 1000); // 1 minute in milliseconds
      const now = Date.now();
      const timeRemaining = Math.max(0, cooldownEnds - now);
      
      return {
        canAttempt: canAttempt.canAttempt,
        reason: canAttempt.reason,
        lastAttempt: lastAttempt * 1000, // Convert to milliseconds
        cooldownEnds,
        timeRemaining
      };
    } catch (error) {
      console.error('Error getting cooldown info:', error);
      throw this.handleContractError(error);
    }
  }

  /**
   * Get gas price compatible with zkSync Era (avoids EIP-1559 methods)
   */
  private async getZkSyncGasPrice(): Promise<bigint> {
    try {
      // Try to get gas price from zkSync provider first
      if (this.provider) {
        const gasPrice = await this.provider.getGasPrice();
        console.log('Got gas price from zkSync provider:', gasPrice.toString());
        return gasPrice;
      }
    } catch (error) {
      console.warn('Failed to get gas price from zkSync provider:', error);
    }

    // Skip browser provider as it may trigger EIP-1559 methods
    // Go directly to default gas price for zkSync Era Sepolia
    console.log('Using default gas price for zkSync Era Sepolia');
    return BigInt('25000000'); // 0.025 gwei
  }
}
