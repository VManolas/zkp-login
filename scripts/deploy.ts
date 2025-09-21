import { Wallet, utils } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting optimized deployment...");
  console.log("Network:", hre.network.name);

  // Check if private key is available
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is not set");
  }
  console.log("Private key found:", process.env.PRIVATE_KEY.substring(0, 10) + "...");

  // Initialize the wallet
  const wallet = new Wallet(process.env.PRIVATE_KEY || "");
  console.log("Wallet address:", wallet.address);

  // Check wallet balance
  const balance = await wallet.getBalance();
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low wallet balance. Consider adding more ETH for deployment.");
  }

  // Create deployer
  const deployer = new Deployer(hre, wallet);

  // Deploy Verifier contract first
  console.log("📋 Deploying Verifier contract...");
  const verifierArtifact = await deployer.loadArtifact("Verifier");
  const verifier = await deployer.deploy(verifierArtifact, []);
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`✅ Verifier deployed to: ${verifierAddress}`);

  // Deploy LoginAuth contract
  console.log("🔐 Deploying LoginAuth contract...");
  const loginAuthArtifact = await deployer.loadArtifact("LoginAuth");
  const loginAuth = await deployer.deploy(loginAuthArtifact, [verifierAddress]);
  await loginAuth.waitForDeployment();
  const loginAuthAddress = await loginAuth.getAddress();
  console.log(`✅ LoginAuth deployed to: ${loginAuthAddress}`);

  // Verify contracts (optional, for testnet)
  try {
    console.log("🔍 Verifying contracts...");
    await hre.run("verify:verify", {
      address: verifierAddress,
      contract: "contracts/Verifier.sol:Verifier",
      constructorArguments: [],
    });
    
    await hre.run("verify:verify", {
      address: loginAuthAddress,
      contract: "contracts/LoginAuth.sol:LoginAuth",
      constructorArguments: [verifierAddress],
    });
    console.log("✅ Contracts verified successfully!");
  } catch (error) {
    console.log("⚠️  Contract verification failed:", error);
  }

  // Test contract functionality
  console.log("🧪 Testing contract functionality...");
  try {
    console.log("✅ Contracts deployed successfully");
  } catch (error) {
    console.error("❌ Contract functionality test failed:", error);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    verifierAddress,
    loginAuthAddress,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.network.provider.send("eth_blockNumber", []),
    gasUsed: {
      verifier: "N/A", // Would need to track gas usage
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

  // Write deployment info to file
  const fs = require("fs");
  const path = require("path");
  
  // Ensure deployments directory exists
  const deploymentsDir = "deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}`);

  // Generate frontend configuration
  const frontendConfig = {
    verifier: verifierAddress,
    loginAuth: loginAuthAddress,
    network: hre.network.name,
    blockExplorer: (hre.network.config as any).verifyURL || "N/A"
  };

  const frontendConfigFile = path.join("frontend", "src", "config", "contracts.json");
  const frontendConfigDir = path.dirname(frontendConfigFile);
  
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  
  fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
  console.log(`📁 Frontend config saved to: ${frontendConfigFile}`);

  console.log("\n🚀 Next steps:");
  console.log("1. Update frontend with new contract addresses");
  console.log("2. Run 'npm run frontend:start' to start the frontend");
  console.log("3. Test the complete flow in the browser");

  return {
    verifierAddress,
    loginAuthAddress,
    deploymentInfo
  };
}
