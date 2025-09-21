import { Wallet, Provider, ContractFactory } from "zksync-ethers";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("🚀 Starting direct zkSync deployment...");
  
  // Check if private key is available
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is not set");
  }
  console.log("Private key found:", process.env.PRIVATE_KEY.substring(0, 10) + "...");

  // Initialize provider and wallet
  const provider = new Provider("https://sepolia.era.zksync.dev");
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("Wallet address:", wallet.address);
  console.log("Network:", await provider.getNetwork());

  // Check wallet balance
  const balance = await wallet.getBalance();
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low wallet balance. Consider adding more ETH for deployment.");
  }

  // Read contract bytecode and ABI
  const verifierArtifact = JSON.parse(fs.readFileSync("artifacts-zk/contracts/Verifier.sol/Verifier.json", "utf8"));
  const loginAuthArtifact = JSON.parse(fs.readFileSync("artifacts-zk/contracts/LoginAuth.sol/LoginAuth.json", "utf8"));

  // Deploy Verifier contract first
  console.log("📋 Deploying Verifier contract...");
  const verifierFactory = new ContractFactory(
    verifierArtifact.abi,
    verifierArtifact.bytecode,
    wallet
  );
  
  const verifier = await verifierFactory.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`✅ Verifier deployed to: ${verifierAddress}`);

  // Deploy LoginAuth contract
  console.log("🔐 Deploying LoginAuth contract...");
  const loginAuthFactory = new ContractFactory(
    loginAuthArtifact.abi,
    loginAuthArtifact.bytecode,
    wallet
  );
  
  const loginAuth = await loginAuthFactory.deploy(verifierAddress);
  await loginAuth.waitForDeployment();
  const loginAuthAddress = await loginAuth.getAddress();
  console.log(`✅ LoginAuth deployed to: ${loginAuthAddress}`);

  // Get deployment info
  const deploymentInfo = {
    network: "zkSyncEraTestnet",
    verifierAddress,
    loginAuthAddress,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    blockNumber: await provider.getBlockNumber(),
    gasUsed: {
      verifier: "N/A",
      loginAuth: "N/A"
    }
  };

  console.log("\n🎉 === Deployment Summary ===");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Verifier: ${verifierAddress}`);
  console.log(`LoginAuth: ${loginAuthAddress}`);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Timestamp: ${deploymentInfo.timestamp}`);
  console.log(`Block Number: ${deploymentInfo.blockNumber}`);

  // Save deployment info to file
  const deploymentsDir = "deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `zkSyncEraTestnet-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);

  // Update frontend configuration
  const frontendConfig = {
    verifier: verifierAddress,
    loginAuth: loginAuthAddress,
    network: "zkSyncEraTestnet",
    blockExplorer: "https://sepolia-era.zksync.network",
    isMock: false,
    note: "Real deployment on zkSync Era Sepolia testnet"
  };

  const frontendConfigFile = path.join("frontend", "src", "config", "contracts.json");
  const frontendConfigDir = path.dirname(frontendConfigFile);
  
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  
  fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
  console.log(`📁 Frontend config updated: ${frontendConfigFile}`);

  console.log("\n🚀 Next steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Run 'npm run frontend:start' to test the frontend");
  console.log("3. Test the complete flow in the browser");

  return {
    verifierAddress,
    loginAuthAddress,
    deploymentInfo
  };
}

// Run the deployment
main()
  .then((result) => {
    console.log("✅ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

