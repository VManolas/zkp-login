import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-ethers";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { ethers } from "ethers";
import * as hre from "hardhat";

describe("LoginAuth Contract - Optimized Version", function () {
  let verifier: Contract;
  let loginAuth: Contract;
  let deployer: Deployer;
  let wallet: Wallet;
  let provider: Provider;

  beforeEach(async function () {
    // Create a new wallet for testing
    provider = Provider.getDefaultProvider();
    wallet = new Wallet(ethers.Wallet.createRandom().privateKey, provider);
    deployer = new Deployer(hre, wallet);

    // Deploy Verifier contract
    const verifierArtifact = await deployer.loadArtifact("Verifier");
    verifier = await deployer.deploy(verifierArtifact, []);
    await verifier.waitForDeployment();

    // Deploy LoginAuth contract
    const loginAuthArtifact = await deployer.loadArtifact("LoginAuth");
    loginAuth = await deployer.deploy(loginAuthArtifact, [await verifier.getAddress()]);
    await loginAuth.waitForDeployment();
  });

  describe("Contract Initialization", function () {
    it("Should initialize with correct verifier address", async function () {
      expect(await loginAuth.verifier()).to.equal(await verifier.getAddress());
    });

    it("Should set deployer as admin", async function () {
      expect(await loginAuth.admin()).to.equal(wallet.address);
    });

    it("Should initialize with correct default values", async function () {
      expect(await loginAuth.paused()).to.be.false;
      expect(await loginAuth.totalUsers()).to.equal(0);
      expect(await loginAuth.totalLoginAttempts()).to.equal(0);
      expect(await loginAuth.totalSuccessfulLogins()).to.equal(0);
    });
  });

  describe("Registration", function () {
    it("Should allow user to register with a hash", async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      
      await expect(loginAuth.register(hashValue))
        .to.emit(loginAuth, "UserRegistered")
        .withArgs(wallet.address, hashValue, await getCurrentTimestamp());
      
      expect(await loginAuth.storedHashes(wallet.address)).to.equal(hashValue);
      expect(await loginAuth.isRegistered(wallet.address)).to.be.true;
      expect(await loginAuth.totalUsers()).to.equal(1);
    });

    it("Should not allow registration with zero hash", async function () {
      await expect(loginAuth.register(0))
        .to.be.revertedWith("Hash value cannot be zero");
    });

    it("Should not allow double registration", async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);
      
      await expect(loginAuth.register(hashValue))
        .to.be.revertedWith("User already registered");
    });

    it("Should track registration timestamp", async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      const tx = await loginAuth.register(hashValue);
      const receipt = await tx.wait();
      const block = await provider.getBlock(receipt.blockNumber);
      
      const userStats = await loginAuth.getUserStats(wallet.address);
      expect(userStats.registrationTime).to.equal(block.timestamp);
    });
  });

  describe("Password Change", function () {
    beforeEach(async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);
    });

    it("Should allow user to change password", async function () {
      const newHashValue = ethers.BigNumber.from("987654321");
      
      await expect(loginAuth.changePassword(newHashValue))
        .to.emit(loginAuth, "UserPasswordChanged")
        .withArgs(wallet.address, newHashValue, await getCurrentTimestamp());
      
      expect(await loginAuth.storedHashes(wallet.address)).to.equal(newHashValue);
    });

    it("Should not allow changing to zero hash", async function () {
      await expect(loginAuth.changePassword(0))
        .to.be.revertedWith("Hash value cannot be zero");
    });

    it("Should not allow changing to same hash", async function () {
      const currentHash = await loginAuth.storedHashes(wallet.address);
      
      await expect(loginAuth.changePassword(currentHash))
        .to.be.revertedWith("New password same as current");
    });

    it("Should not allow unregistered user to change password", async function () {
      const newWallet = new Wallet(ethers.Wallet.createRandom().privateKey, provider);
      const loginAuthAsNewUser = loginAuth.connect(newWallet);
      
      await expect(loginAuthAsNewUser.changePassword(ethers.BigNumber.from("999999999")))
        .to.be.revertedWith("User not registered");
    });
  });

  describe("Login", function () {
    beforeEach(async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);
    });

    it("Should handle login attempt (with mock proof)", async function () {
      // Mock proof data
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("123456789"), // storedHash
        ethers.BigNumber.from("1") // isValid
      ];

      // Since our Verifier is a mock, this will return true
      const result = await loginAuth.login(proof, publicInputs);
      
      expect(result).to.be.true;
      expect(await loginAuth.successfulLogins(wallet.address)).to.equal(1);
      expect(await loginAuth.totalSuccessfulLogins()).to.equal(1);
    });

    it("Should not allow login for unregistered user", async function () {
      const newWallet = new Wallet(ethers.Wallet.createRandom().privateKey, provider);
      const loginAuthAsNewUser = loginAuth.connect(newWallet);
      
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("123456789"),
        ethers.BigNumber.from("1")
      ];

      await expect(loginAuthAsNewUser.login(proof, publicInputs))
        .to.be.revertedWith("User not registered");
    });

    it("Should not allow login with wrong stored hash", async function () {
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("999999999"), // wrong hash
        ethers.BigNumber.from("1")
      ];

      await expect(loginAuth.login(proof, publicInputs))
        .to.be.revertedWith("Invalid stored hash");
    });

    it("Should track login attempts", async function () {
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("123456789"),
        ethers.BigNumber.from("1")
      ];

      await loginAuth.login(proof, publicInputs);
      
      expect(await loginAuth.loginAttempts(wallet.address)).to.equal(1);
      expect(await loginAuth.totalLoginAttempts()).to.equal(1);
    });

    it("Should track last login attempt timestamp", async function () {
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("123456789"),
        ethers.BigNumber.from("1")
      ];

      const tx = await loginAuth.login(proof, publicInputs);
      const receipt = await tx.wait();
      const block = await provider.getBlock(receipt.blockNumber);
      
      const userStats = await loginAuth.getUserStats(wallet.address);
      expect(userStats.lastAttempt).to.equal(block.timestamp);
    });
  });

  describe("Rate Limiting", function () {
    beforeEach(async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);
    });

    it("Should allow login within rate limits", async function () {
      const canAttempt = await loginAuth.canAttemptLogin(wallet.address);
      expect(canAttempt.canAttempt).to.be.true;
    });

    it("Should prevent login during cooldown", async function () {
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("123456789"),
        ethers.BigNumber.from("1")
      ];

      // First login attempt
      await loginAuth.login(proof, publicInputs);
      
      // Immediate second attempt should fail due to cooldown
      await expect(loginAuth.login(proof, publicInputs))
        .to.be.revertedWith("Login cooldown not met");
    });

    it("Should prevent login after max daily attempts", async function () {
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("123456789"),
        ethers.BigNumber.from("1")
      ];

      // Set login attempts to max
      for (let i = 0; i < 10; i++) {
        await loginAuth.login(proof, publicInputs);
        // Wait for cooldown
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Next attempt should fail
      await expect(loginAuth.login(proof, publicInputs))
        .to.be.revertedWith("Daily login attempts exceeded");
    });
  });

  describe("User Statistics", function () {
    it("Should track login attempts and successes", async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);

      const stats = await loginAuth.getUserStats(wallet.address);
      expect(stats.attempts).to.equal(0);
      expect(stats.successful).to.equal(0);
      expect(stats.registered).to.be.true;

      // Simulate a login attempt
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        hashValue,
        ethers.BigNumber.from("1")
      ];

      await loginAuth.login(proof, publicInputs);

      const statsAfter = await loginAuth.getUserStats(wallet.address);
      expect(statsAfter.attempts).to.equal(1);
      expect(statsAfter.successful).to.equal(1);
    });

    it("Should return global statistics", async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);

      const globalStats = await loginAuth.getGlobalStats();
      expect(globalStats.users).to.equal(1);
      expect(globalStats.attempts).to.equal(0);
      expect(globalStats.successful).to.equal(0);
      expect(globalStats.paused).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to remove user", async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);

      expect(await loginAuth.isRegistered(wallet.address)).to.be.true;

      await expect(loginAuth.removeUser(wallet.address))
        .to.emit(loginAuth, "UserRemoved")
        .withArgs(wallet.address, wallet.address, await getCurrentTimestamp());

      expect(await loginAuth.isRegistered(wallet.address)).to.be.false;
      expect(await loginAuth.storedHashes(wallet.address)).to.equal(0);
      expect(await loginAuth.totalUsers()).to.equal(0);
    });

    it("Should allow admin transfer", async function () {
      const newAdmin = ethers.Wallet.createRandom().address;
      
      await expect(loginAuth.transferAdmin(newAdmin))
        .to.emit(loginAuth, "AdminTransferred")
        .withArgs(wallet.address, newAdmin, await getCurrentTimestamp());
      
      expect(await loginAuth.admin()).to.equal(newAdmin);
    });

    it("Should allow admin to pause contract", async function () {
      await loginAuth.pause();
      expect(await loginAuth.paused()).to.be.true;
    });

    it("Should allow admin to unpause contract", async function () {
      await loginAuth.pause();
      await loginAuth.unpause();
      expect(await loginAuth.paused()).to.be.false;
    });

    it("Should prevent non-admin from calling admin functions", async function () {
      const newWallet = new Wallet(ethers.Wallet.createRandom().privateKey, provider);
      const loginAuthAsNonAdmin = loginAuth.connect(newWallet);
      
      await expect(loginAuthAsNonAdmin.removeUser(wallet.address))
        .to.be.revertedWith("Only admin can call this function");
      
      await expect(loginAuthAsNonAdmin.pause())
        .to.be.revertedWith("Only admin can call this function");
    });
  });

  describe("Pause Functionality", function () {
    beforeEach(async function () {
      const hashValue = ethers.BigNumber.from("123456789");
      await loginAuth.register(hashValue);
    });

    it("Should prevent registration when paused", async function () {
      await loginAuth.pause();
      
      const newWallet = new Wallet(ethers.Wallet.createRandom().privateKey, provider);
      const loginAuthAsNewUser = loginAuth.connect(newWallet);
      
      await expect(loginAuthAsNewUser.register(ethers.BigNumber.from("999999999")))
        .to.be.revertedWith("Contract is paused");
    });

    it("Should prevent login when paused", async function () {
      await loginAuth.pause();
      
      const proof = "0x1234567890abcdef";
      const publicInputs = [
        ethers.BigNumber.from("123456789"),
        ethers.BigNumber.from("1")
      ];

      await expect(loginAuth.login(proof, publicInputs))
        .to.be.revertedWith("Contract is paused");
    });

    it("Should prevent password change when paused", async function () {
      await loginAuth.pause();
      
      await expect(loginAuth.changePassword(ethers.BigNumber.from("999999999")))
        .to.be.revertedWith("Contract is paused");
    });
  });

  // Helper function to get current timestamp
  async function getCurrentTimestamp(): Promise<number> {
    const block = await provider.getBlock('latest');
    return block.timestamp;
  }
});

