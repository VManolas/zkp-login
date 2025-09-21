import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Starting simple deployment...");
  console.log("Network:", hre.network.name);

  // Check if private key is available
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is not set");
  }

  // Initialize the wallet
  const wallet = new Wallet(process.env.PRIVATE_KEY || "");
  console.log("Wallet address:", wallet.address);

  // Check wallet balance
  const balance = await wallet.getBalance();
  console.log("Wallet balance:", ethers.formatEther(balance), "ETH");

  // Create deployer
  const deployer = new Deployer(hre, wallet);

  // Deploy Verifier contract first
  console.log("📋 Deploying Verifier contract...");
  const verifierArtifact = await deployer.loadArtifact("Groth16Verifier");
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

  console.log("\n🎉 === Deployment Summary ===");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Verifier: ${verifierAddress}`);
  console.log(`LoginAuth: ${loginAuthAddress}`);
  console.log(`Deployer: ${wallet.address}`);

  return {
    verifierAddress,
    loginAuthAddress
  };
}

