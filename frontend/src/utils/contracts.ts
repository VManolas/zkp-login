// Optimized contract interaction utilities
import { Provider, Wallet, Contract as ZkSyncContract, BrowserProvider } from 'zksync-ethers';
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
  "event UserRegistered(address indexed user, uint256 indexed hashValue, uint256 timestamp)",
  "event UserLoggedIn(address indexed user, bool success, uint256 timestamp)",
  "event UserPasswordChanged(address indexed user, uint256 indexed newHashValue, uint256 timestamp)"
];

const VERIFIER_ABI = [
  "function verifyProof(bytes calldata proof, uint256[2] calldata publicSignals) external view returns (bool)",
  "function verifyProofWithHash(bytes calldata proof, uint256[2] calldata publicSignals, uint256 expectedHash) external view returns (bool)"
];

export class ContractManager {
  private provider: Provider;
  private signer: Wallet | null = null;
  private browserProvider: BrowserProvider | null = null;
  private loginAuthContract: ZkSyncContract | null = null;
  private verifierContract: ZkSyncContract | null = null;
  private contractAddresses: ContractAddresses;
  private networkInfo: any = null;

  constructor(contractAddresses: ContractAddresses) {
    this.contractAddresses = contractAddresses;
    // Initialize zkSync provider with proper configuration
    this.provider = new Provider("https://sepolia.era.zksync.dev");
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

    return {
      loginAuthContract: new ZkSyncContract(
        this.contractAddresses.loginAuth,
        LOGIN_AUTH_ABI,
        this.signer
      ),
      verifierContract: new ZkSyncContract(
        this.contractAddresses.verifier,
        VERIFIER_ABI,
        this.signer
      )
    };
  }

  /**
   * Connect to wallet and initialize contracts
   */
  async connectWallet(): Promise<string> {
    try {
      // Check if MetaMask is installed
      if (!(window as any).ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      // Create browser provider for zkSync with network configuration
      const browserProvider = new BrowserProvider((window as any).ethereum, {
        name: 'zkSync Era Sepolia',
        chainId: 300
      });
      
      // Get the signer from the browser provider
      const signer = await browserProvider.getSigner();
      
      // Store the signer for transaction operations
      this.signer = signer as any; // Type assertion for now
      
      // Also store the browser provider for contract initialization
      this.browserProvider = browserProvider;
      
      // Get network info
      this.networkInfo = await this.getNetworkInfo();
      
      // Ensure the provider is properly initialized for L2 operations
      // This is crucial for zkSync Era transactions
      await this.provider.getNetwork();
      
      // Initialize contracts with the regular provider for read operations
      this.loginAuthContract = new ZkSyncContract(
        this.contractAddresses.loginAuth,
        LOGIN_AUTH_ABI,
        this.provider // Use regular provider for read operations
      );
      
      this.verifierContract = new ZkSyncContract(
        this.contractAddresses.verifier,
        VERIFIER_ABI,
        this.provider // Use regular provider for read operations
      );
      
      return address;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
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
      
      // Get signer address to ensure it's connected
      const address = await this.signer.getAddress();
      console.log('Signer address:', address);
      
      // Get the signer's provider and check network
      const signerProvider = this.signer.provider;
      if (signerProvider) {
        const network = await signerProvider.getNetwork();
        console.log('Signer provider network:', network);
        
        // Ensure we're connected to zkSync Era Sepolia (Chain ID: 300)
        if (Number(network.chainId) !== 300) {
          const networkName = this.getNetworkName(Number(network.chainId));
          throw new Error(`Wrong network detected. Please switch to zkSync Era Sepolia testnet.\n\nCurrent network: ${networkName} (Chain ID: ${network.chainId})\nRequired network: zkSync Era Sepolia (Chain ID: 300)\n\nPlease switch your wallet to the correct network and try again.`);
        }
        
        // Force L2 provider initialization by getting block number
        const blockNumber = await signerProvider.getBlockNumber();
        console.log('Current block number:', blockNumber);
      }
      
      console.log('Provider initialized for L2 operations');
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
      const tx = await loginAuthContract.register(hashBigInt);
      console.log('Registration transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Registration transaction confirmed:', receipt);
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

      // Convert public inputs to BigInt array
      const publicInputsBigInt = publicInputs.map(input => BigInt(input));
      
      // Call login function with the correct proof format
      const result = await loginAuthContract.login(
        proof.pi_a,
        proof.pi_b,
        proof.pi_c,
        publicInputsBigInt
      );
      
      return {
        success: result,
        message: result ? 'Login successful!' : 'Login failed: Invalid proof',
        canRetry: !result
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
      const tx = await loginAuthContract.changePassword(hashBigInt);
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
      const address = await this.signer.getAddress();
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
    const retryableCodes = ['USER_REJECTED', 'INSUFFICIENT_FUNDS'];
    return retryableCodes.includes(error.code);
  }

  /**
   * Get current network info
   */
  getCurrentNetworkInfo(): any {
    return this.networkInfo;
  }
}
