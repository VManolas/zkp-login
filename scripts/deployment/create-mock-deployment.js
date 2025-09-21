// Create mock deployment for testing purposes
const fs = require('fs');
const path = require('path');

// Generate mock contract addresses
function generateMockAddress() {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < 40; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Create mock deployment
const mockDeployment = {
  network: 'zkSyncEraTestnet',
  verifierAddress: generateMockAddress(),
  loginAuthAddress: generateMockAddress(),
  deployer: '0xEf01b1B33F56607fF932C7E057308acaB0E8C52B',
  timestamp: new Date().toISOString(),
  blockNumber: 5788868,
  isMock: true,
  note: 'Mock deployment for testing - contracts not actually deployed'
};

// Save mock deployment
const deploymentFile = `deployments/mock-${Date.now()}.json`;
fs.writeFileSync(deploymentFile, JSON.stringify(mockDeployment, null, 2));

console.log('🎭 Mock deployment created:');
console.log('📋 Verifier:', mockDeployment.verifierAddress);
console.log('🔐 LoginAuth:', mockDeployment.loginAuthAddress);
console.log('📁 Saved to:', deploymentFile);

// Update frontend config
const frontendConfig = {
  verifier: mockDeployment.verifierAddress,
  loginAuth: mockDeployment.loginAuthAddress,
  network: 'zkSyncEraTestnet',
  blockExplorer: 'https://sepolia-era.zksync.network',
  isMock: true,
  note: 'Mock deployment for testing - contracts not actually deployed'
};

const frontendConfigPath = 'frontend/src/config/contracts.json';
fs.writeFileSync(frontendConfigPath, JSON.stringify(frontendConfig, null, 2));

console.log('✅ Frontend config updated with mock addresses');
console.log('⚠️  Note: These are mock addresses - contracts are not actually deployed');
console.log('💡 You can test the UI flow, but contract interactions will fail');


