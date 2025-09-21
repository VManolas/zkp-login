// Type definitions for the optimized zkSync Era ZKP Login dApp

export interface UserStats {
  attempts: number;
  successful: number;
  registered: boolean;
  lastAttempt: number;
  registrationTime: number;
}

export interface GlobalStats {
  users: number;
  attempts: number;
  successful: number;
  paused: boolean;
}

export interface ProofData {
  proof: string;
  publicSignals: string[];
}

export interface ContractAddresses {
  verifier: string;
  loginAuth: string;
}

export interface LoginState {
  isConnected: boolean;
  isRegistered: boolean;
  isLoggedIn: boolean;
  userAddress?: string;
  userStats?: UserStats;
  globalStats?: GlobalStats;
  canAttemptLogin?: boolean;
  loginReason?: string;
}

export interface CircuitInputs {
  password: string;
  storedHash: string;
}

export interface ZKProofGenerationResult {
  proof: any;
  publicSignals: string[];
  isValid: boolean;
}

export interface LoginAttemptResult {
  success: boolean;
  message: string;
  canRetry: boolean;
  retryAfter?: number;
}

export interface ContractError {
  code: string;
  message: string;
  data?: any;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer?: string;
}

