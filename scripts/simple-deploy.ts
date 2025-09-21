import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting simple deployment...");
  console.log("Network:", hre.network.name);
  console.log("RPC URL:", hre.network.config.url);

  try {
    // Check environment
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY environment variable is not set");
    }
    console.log("✅ Private key found");

    // Initialize wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY || "");
    console.log("Wallet address:", wallet.address);

    // Check balance
    console.log("Checking wallet balance...");
    const balance = await wallet.getBalance();
    console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.01")) {
      console.warn("⚠️  Warning: Low wallet balance. Consider adding more ETH for deployment.");
      console.log("Please add some Sepolia ETH to your wallet and try again.");
      return;
    }

    // Create deployer
    const deployer = new Deployer(hre, wallet);

    // Deploy Verifier
    console.log("📋 Deploying Verifier contract...");
    const verifierArtifact = await deployer.loadArtifact("Verifier");
    const verifier = await deployer.deploy(verifierArtifact, []);
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log(`✅ Verifier deployed to: ${verifierAddress}`);

    // Deploy LoginAuth
    console.log("🔐 Deploying LoginAuth contract...");
    const loginAuthArtifact = await deployer.loadArtifact("LoginAuth");
    const loginAuth = await deployer.deploy(loginAuthArtifact, [verifierAddress]);
    await loginAuth.waitForDeployment();
    const loginAuthAddress = await loginAuth.getAddress();
    console.log(`✅ LoginAuth deployed to: ${loginAuthAddress}`);

    // Update frontend config
    const fs = require("fs");
    const path = require("path");
    
    const frontendConfig = {
      verifier: verifierAddress,
      loginAuth: loginAuthAddress,
      network: hre.network.name,
      blockExplorer: "https://explorer.sepolia.era.zksync.dev",
      isMock: false,
      note: "Production deployment on Sepolia testnet"
    };

    const frontendConfigFile = path.join("frontend", "src", "config", "contracts.json");
    fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));
    console.log(`📁 Frontend config updated: ${frontendConfigFile}`);

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      verifierAddress,
      loginAuthAddress,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      blockNumber: await hre.network.provider.send("eth_blockNumber", [])
    };

    const deploymentsDir = "deployments";
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📁 Deployment info saved to: ${deploymentFile}`);

    console.log("\n🎉 === Deployment Summary ===");
    console.log(`Network: ${deploymentInfo.network}`);
    console.log(`Verifier: ${verifierAddress}`);
    console.log(`LoginAuth: ${loginAuthAddress}`);
    console.log(`Deployer: ${wallet.address}`);
    console.log(`Timestamp: ${deploymentInfo.timestamp}`);
    console.log(`Block Number: ${deploymentInfo.blockNumber}`);

    console.log("\n🚀 Next steps:");
    console.log("1. Start the frontend: cd frontend && npm start");
    console.log("2. Test the complete flow in the browser");
    console.log("3. Connect wallet and try registration/login");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

