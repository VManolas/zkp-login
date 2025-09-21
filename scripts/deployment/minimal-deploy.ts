import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";
import * as fs from "fs";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 MINIMAL DEPLOYMENT STARTING...");
  
  try {
    // Check environment
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found");
    }
    console.log("✅ Environment checked");

    // Initialize wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY || "");
    console.log("✅ Wallet initialized:", wallet.address);

    // Check balance
    const balance = await wallet.getBalance();
    console.log("✅ Balance checked:", ethers.formatEther(balance), "ETH");

    // Create deployer
    const deployer = new Deployer(hre, wallet);
    console.log("✅ Deployer created");

    // Deploy Verifier
    console.log("📋 Deploying Verifier...");
    const verifierArtifact = await deployer.loadArtifact("Verifier");
    const verifier = await deployer.deploy(verifierArtifact, []);
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log("✅ Verifier deployed to:", verifierAddress);

    // Deploy LoginAuth
    console.log("🔐 Deploying LoginAuth...");
    const loginAuthArtifact = await deployer.loadArtifact("LoginAuth");
    const loginAuth = await deployer.deploy(loginAuthArtifact, [verifierAddress]);
    await loginAuth.waitForDeployment();
    const loginAuthAddress = await loginAuth.getAddress();
    console.log("✅ LoginAuth deployed to:", loginAuthAddress);

    // Save deployment info
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
    console.log("✅ Deployment saved to:", deploymentFile);

    // Update frontend config
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
    
  } catch (error) {
    console.error("❌ DEPLOYMENT FAILED:", error);
    throw error;
  }
}


