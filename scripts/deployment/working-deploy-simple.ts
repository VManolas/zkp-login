import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";
import * as fs from "fs";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 WORKING DEPLOYMENT STARTING...");
  console.log("Network:", hre.network.name);
  
  try {
    // Check environment
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found");
    }
    console.log("✅ Private key found");

    // Initialize wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY || "");
    console.log("✅ Wallet address:", wallet.address);

    // Check balance
    const balance = await wallet.getBalance();
    console.log("✅ Balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.01")) {
      throw new Error("Insufficient balance");
    }

    // Create deployer
    const deployer = new Deployer(hre, wallet);
    console.log("✅ Deployer created");

    // Deploy Verifier
    console.log("📋 Deploying Verifier contract...");
    const verifierArtifact = await deployer.loadArtifact("Verifier");
    console.log("✅ Verifier artifact loaded");
    
    const verifier = await deployer.deploy(verifierArtifact, []);
    console.log("✅ Verifier deployment initiated");
    
    await verifier.waitForDeployment();
    console.log("✅ Verifier deployment completed");
    
    const verifierAddress = await verifier.getAddress();
    console.log(`🎉 Verifier deployed to: ${verifierAddress}`);

    // Deploy LoginAuth
    console.log("🔐 Deploying LoginAuth contract...");
    const loginAuthArtifact = await deployer.loadArtifact("LoginAuth");
    console.log("✅ LoginAuth artifact loaded");
    
    const loginAuth = await deployer.deploy(loginAuthArtifact, [verifierAddress]);
    console.log("✅ LoginAuth deployment initiated");
    
    await loginAuth.waitForDeployment();
    console.log("✅ LoginAuth deployment completed");
    
    const loginAuthAddress = await loginAuth.getAddress();
    console.log(`🎉 LoginAuth deployed to: ${loginAuthAddress}`);

    // Save deployment info
    console.log("💾 Saving deployment info...");
    const deploymentInfo = {
      network: hre.network.name,
      verifierAddress: verifierAddress,
      loginAuthAddress: loginAuthAddress,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      blockNumber: await hre.ethers.provider.getBlockNumber()
    };
    
    const deploymentFile = `deployments/${hre.network.name}-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`✅ Deployment saved to: ${deploymentFile}`);

    // Update frontend config
    console.log("🔄 Updating frontend config...");
    const frontendConfig = {
      verifier: verifierAddress,
      loginAuth: loginAuthAddress,
      network: hre.network.name,
      blockExplorer: "https://sepolia-era.zksync.network",
      isMock: false,
      note: "Live deployment on zkSync Era Sepolia testnet"
    };
    
    fs.writeFileSync("frontend/src/config/contracts.json", JSON.stringify(frontendConfig, null, 2));
    console.log("✅ Frontend config updated");

    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("📋 Verifier:", verifierAddress);
    console.log("🔐 LoginAuth:", loginAuthAddress);
    
  } catch (error) {
    console.error("❌ DEPLOYMENT FAILED:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}


