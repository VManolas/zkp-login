import { Wallet, Provider } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`🚀 Running deploy script for contracts on zkSync!`);
  console.log(`Network: ${hre.network.name}`);

  try {
    // Check environment
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found");
    }
    console.log("✅ Private key found");

    // Initialize the wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY || "");
    console.log("✅ Wallet address:", wallet.address);

    // Check balance
    const balance = await wallet.getBalance();
    console.log("✅ Balance:", (Number(balance) / 1e18).toFixed(6), "ETH");

    if (balance < BigInt('10000000000000000')) { // 0.01 ETH
      throw new Error("Insufficient balance");
    }

    // Create deployer object
    const deployer = new Deployer(hre, wallet);
    console.log("✅ Deployer created");

    // Deploy Verifier contract
    console.log("📋 Deploying Verifier contract...");
    const verifierArtifact = await deployer.loadArtifact("Verifier");
    console.log("✅ Verifier artifact loaded");
    
    const verifierContract = await deployer.deploy(verifierArtifact, []);
    console.log("✅ Verifier deployment initiated");
    
    await verifierContract.waitForDeployment();
    console.log("✅ Verifier deployment completed");
    
    const verifierAddress = await verifierContract.getAddress();
    console.log(`🎉 Verifier deployed to: ${verifierAddress}`);

    // Deploy LoginAuth contract
    console.log("🔐 Deploying LoginAuth contract...");
    const loginAuthArtifact = await deployer.loadArtifact("LoginAuth");
    console.log("✅ LoginAuth artifact loaded");
    
    const loginAuthContract = await deployer.deploy(loginAuthArtifact, [verifierAddress]);
    console.log("✅ LoginAuth deployment initiated");
    
    await loginAuthContract.waitForDeployment();
    console.log("✅ LoginAuth deployment completed");
    
    const loginAuthAddress = await loginAuthContract.getAddress();
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
    const fs = require('fs');
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


