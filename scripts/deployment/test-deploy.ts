import { Wallet, Provider } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 TEST DEPLOYMENT STARTING...");
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
    console.log("✅ Balance:", (Number(balance) / 1e18).toFixed(6), "ETH");

    if (balance < BigInt('10000000000000000')) { // 0.01 ETH
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

    console.log("🎉 TEST DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("📋 Verifier:", verifierAddress);
    console.log("🔐 LoginAuth:", loginAuthAddress);
    
  } catch (error) {
    console.error("❌ TEST DEPLOYMENT FAILED:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}