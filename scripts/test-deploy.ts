import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🧪 Testing deployment setup...");
  console.log("Network:", hre.network.name);
  console.log("RPC URL:", hre.network.config.url);

  try {
    // Check if private key is available
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY environment variable is not set");
    }
    console.log("✅ Private key found");

    // Initialize the wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY || "");
    console.log("Wallet address:", wallet.address);

    // Test network connection
    console.log("Testing network connection...");
    const balance = await wallet.getBalance();
    console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.01")) {
      console.warn("⚠️  Warning: Low wallet balance. Consider adding more ETH for deployment.");
    }

    // Test contract compilation
    console.log("Testing contract compilation...");
    const deployer = new Deployer(hre, wallet);
    
    // Try to load artifacts
    const verifierArtifact = await deployer.loadArtifact("Verifier");
    console.log("✅ Verifier artifact loaded successfully");
    
    const loginAuthArtifact = await deployer.loadArtifact("LoginAuth");
    console.log("✅ LoginAuth artifact loaded successfully");

    console.log("✅ All tests passed! Ready for deployment.");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

