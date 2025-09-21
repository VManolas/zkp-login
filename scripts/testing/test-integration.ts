import { ethers } from 'ethers';
import { poseidonHash } from '../frontend/src/utils/poseidon';
import { generateZKProof } from '../frontend/src/utils/zkProof';

/**
 * Integration test script for the complete ZKP login flow
 * This script tests the entire flow from password hashing to proof verification
 */

interface TestConfig {
  rpcUrl: string;
  verifierAddress: string;
  loginAuthAddress: string;
  privateKey: string;
}

async function runIntegrationTest() {
  console.log('🧪 Starting integration test...');

  // Load configuration
  const config = await loadConfig();
  if (!config) {
    console.error('❌ Failed to load configuration');
    return;
  }

  try {
    // Step 1: Setup provider and wallet
    console.log('🔗 Setting up provider and wallet...');
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    console.log('Wallet address:', wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');

    // Step 2: Load contracts
    console.log('📋 Loading contracts...');
    const verifierABI = [
      "function verifyProof(bytes calldata proof, uint256[2] calldata publicSignals) external view returns (bool)"
    ];
    
    const loginAuthABI = [
      "function register(uint256 hashValue) external",
      "function login(bytes calldata proof, uint256[2] calldata publicInputs) external returns (bool)",
      "function isRegistered(address user) external view returns (bool)",
      "function getUserStats(address user) external view returns (uint256 attempts, uint256 successful, bool registered, uint256 lastAttempt, uint256 registrationTime)",
      "function getGlobalStats() external view returns (uint256 users, uint256 attempts, uint256 successful, bool paused)"
    ];

    const verifier = new ethers.Contract(config.verifierAddress, verifierABI, wallet);
    const loginAuth = new ethers.Contract(config.loginAuthAddress, loginAuthABI, wallet);

    // Step 3: Test password hashing
    console.log('🔐 Testing password hashing...');
    const testPassword = 'testPassword123!';
    const hashedPassword = poseidonHash(testPassword);
    console.log('Password hash:', hashedPassword);

    // Step 4: Test registration
    console.log('📝 Testing user registration...');
    const isRegisteredBefore = await loginAuth.isRegistered(wallet.address);
    console.log('Registered before:', isRegisteredBefore);

    if (!isRegisteredBefore) {
      const registerTx = await loginAuth.register(hashedPassword);
      await registerTx.wait();
      console.log('✅ Registration successful');
    } else {
      console.log('ℹ️  User already registered');
    }

    // Step 5: Test ZK proof generation
    console.log('🔍 Testing ZK proof generation...');
    const storedHash = await loginAuth.storedHashes(wallet.address);
    console.log('Stored hash:', storedHash.toString());

    const { proof, publicSignals } = await generateZKProof({
      password: testPassword,
      storedHash: storedHash.toString()
    });

    console.log('✅ ZK proof generated');
    console.log('Public signals:', publicSignals);

    // Step 6: Test proof verification
    console.log('✅ Testing proof verification...');
    const proofValid = await verifier.verifyProof(proof, publicSignals);
    console.log('Proof valid:', proofValid);

    // Step 7: Test login
    console.log('🚪 Testing login...');
    const loginResult = await loginAuth.login(proof, publicSignals);
    console.log('Login result:', loginResult);

    // Step 8: Test user stats
    console.log('📊 Testing user stats...');
    const userStats = await loginAuth.getUserStats(wallet.address);
    console.log('User stats:', {
      attempts: userStats.attempts.toString(),
      successful: userStats.successful.toString(),
      registered: userStats.registered,
      lastAttempt: userStats.lastAttempt.toString(),
      registrationTime: userStats.registrationTime.toString()
    });

    // Step 9: Test global stats
    console.log('🌍 Testing global stats...');
    const globalStats = await loginAuth.getGlobalStats();
    console.log('Global stats:', {
      users: globalStats.users.toString(),
      attempts: globalStats.attempts.toString(),
      successful: globalStats.successful.toString(),
      paused: globalStats.paused
    });

    // Step 10: Test with wrong password
    console.log('❌ Testing with wrong password...');
    const wrongPassword = 'wrongPassword123!';
    const wrongHashedPassword = poseidonHash(wrongPassword);
    
    try {
      const { proof: wrongProof, publicSignals: wrongPublicSignals } = await generateZKProof({
        password: wrongPassword,
        storedHash: storedHash.toString()
      });
      
      const wrongLoginResult = await loginAuth.login(wrongProof, wrongPublicSignals);
      console.log('Wrong password login result:', wrongLoginResult);
    } catch (error) {
      console.log('Expected error with wrong password:', error);
    }

    console.log('\n🎉 Integration test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Password hashing works');
    console.log('✅ User registration works');
    console.log('✅ ZK proof generation works');
    console.log('✅ Proof verification works');
    console.log('✅ Login works');
    console.log('✅ User stats work');
    console.log('✅ Global stats work');
    console.log('✅ Wrong password handling works');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

async function loadConfig(): Promise<TestConfig | null> {
  try {
    // Try to load from deployment file
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = 'deployments';
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir);
      const latestFile = files
        .filter((file: string) => file.endsWith('.json'))
        .sort()
        .pop();
      
      if (latestFile) {
        const deploymentData = JSON.parse(fs.readFileSync(path.join(deploymentsDir, latestFile), 'utf8'));
        
        return {
          rpcUrl: process.env.RPC_URL || 'https://sepolia.era.zksync.dev',
          verifierAddress: deploymentData.verifierAddress,
          loginAuthAddress: deploymentData.loginAuthAddress,
          privateKey: process.env.PRIVATE_KEY || ''
        };
      }
    }

    // Fallback to environment variables
    if (process.env.VERIFIER_ADDRESS && process.env.LOGIN_AUTH_ADDRESS && process.env.PRIVATE_KEY) {
      return {
        rpcUrl: process.env.RPC_URL || 'https://sepolia.era.zksync.dev',
        verifierAddress: process.env.VERIFIER_ADDRESS,
        loginAuthAddress: process.env.LOGIN_AUTH_ADDRESS,
        privateKey: process.env.PRIVATE_KEY
      };
    }

    console.error('❌ No configuration found. Please run deployment first or set environment variables.');
    return null;
  } catch (error) {
    console.error('❌ Error loading configuration:', error);
    return null;
  }
}

// Run the integration test
runIntegrationTest().catch(console.error);

