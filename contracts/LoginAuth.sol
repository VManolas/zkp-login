// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Verifier.sol";

/**
 * @title LoginAuth - Optimized Version
 * @dev Smart contract for zero-knowledge password authentication on zkSync Era
 * 
 * This contract allows users to:
 * 1. Register by storing a hash of their password
 * 2. Login by providing a ZK proof that they know the password
 * 3. Change password with a new ZK proof
 * 
 * Security Features:
 * - Passwords are never stored in plaintext
 * - Only hashes are stored on-chain
 * - ZK proofs ensure password knowledge without revealing it
 * - Rate limiting to prevent brute force attacks
 * - Admin controls for emergency situations
 * - Gas-optimized operations
 */
contract LoginAuth {
    // Events for tracking important actions
    event UserRegistered(address indexed user, uint256 indexed hashValue, uint256 timestamp);
    event UserLoggedIn(address indexed user, bool success, uint256 timestamp);
    event UserPasswordChanged(address indexed user, uint256 indexed newHashValue, uint256 timestamp);
    event UserRemoved(address indexed user, address indexed admin, uint256 timestamp);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin, uint256 timestamp);

    // Verifier contract for ZK proof verification
    Verifier public immutable verifier;
    
    // Mapping to store password hashes for each user
    mapping(address => uint256) public storedHashes;
    
    // Mapping to track login attempts (for analytics/security)
    mapping(address => uint256) public loginAttempts;
    
    // Mapping to track successful logins
    mapping(address => uint256) public successfulLogins;
    
    // Mapping to track last login attempt timestamp (for rate limiting)
    mapping(address => uint256) public lastLoginAttempt;
    
    // Mapping to track user registration timestamp
    mapping(address => uint256) public registrationTimestamp;
    
    // Admin address for emergency functions
    address public admin;
    
    // Circuit parameters
    uint256 public constant MAX_PUBLIC_INPUTS = 2;
    
    // Rate limiting parameters
    uint256 public constant LOGIN_COOLDOWN = 1 minutes; // 1 minute cooldown between login attempts
    uint256 public constant MAX_DAILY_ATTEMPTS = 10; // Maximum login attempts per day
    
    // Contract state
    bool public paused = false;
    uint256 public totalUsers = 0;
    uint256 public totalLoginAttempts = 0;
    uint256 public totalSuccessfulLogins = 0;
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyRegistered() {
        require(storedHashes[msg.sender] != 0, "User not registered");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier rateLimited() {
        require(
            block.timestamp >= lastLoginAttempt[msg.sender] + LOGIN_COOLDOWN,
            "Login cooldown not met"
        );
        require(
            loginAttempts[msg.sender] < MAX_DAILY_ATTEMPTS,
            "Daily login attempts exceeded"
        );
        _;
    }

    /**
     * @dev Constructor sets the verifier contract address and admin
     * @param _verifier Address of the Verifier contract
     */
    constructor(address _verifier) {
        require(_verifier != address(0), "Invalid verifier address");
        verifier = Verifier(_verifier);
        admin = msg.sender;
    }

    /**
     * @dev Register a new user with their password hash
     * @param hashValue The Poseidon hash of the user's password
     * 
     * Requirements:
     * - User must not already be registered
     * - Hash value must not be zero
     * - Contract must not be paused
     */
    function register(uint256 hashValue) external whenNotPaused {
        require(hashValue != 0, "Hash value cannot be zero");
        require(storedHashes[msg.sender] == 0, "User already registered");
        
        storedHashes[msg.sender] = hashValue;
        registrationTimestamp[msg.sender] = block.timestamp;
        totalUsers++;
        
        emit UserRegistered(msg.sender, hashValue, block.timestamp);
    }

    /**
     * @dev Change password for an existing user
     * @param newHashValue The new Poseidon hash of the user's password
     * 
     * Requirements:
     * - User must be registered
     * - New hash value must not be zero
     * - New password must be different from current
     * - Contract must not be paused
     */
    function changePassword(uint256 newHashValue) external onlyRegistered whenNotPaused {
        require(newHashValue != 0, "Hash value cannot be zero");
        require(newHashValue != storedHashes[msg.sender], "New password same as current");
        
        storedHashes[msg.sender] = newHashValue;
        
        emit UserPasswordChanged(msg.sender, newHashValue, block.timestamp);
    }

    /**
     * @dev Login using a ZK proof
     * @param _pA Proof parameter A
     * @param _pB Proof parameter B  
     * @param _pC Proof parameter C
     * @param _pubSignals Public signals [storedHash, isValid]
     * 
     * @return success True if login is successful, false otherwise
     * 
     * Requirements:
     * - User must be registered
     * - Public inputs must match the stored hash
     * - ZK proof must be valid
     * - Rate limiting must be satisfied
     * - Contract must not be paused
     */
    function login(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[1] calldata _pubSignals
    ) external onlyRegistered whenNotPaused rateLimited returns (bool success) {
        // Update attempt tracking
        loginAttempts[msg.sender]++;
        lastLoginAttempt[msg.sender] = block.timestamp;
        totalLoginAttempts++;
        
        // Validate public inputs length
        require(_pubSignals.length == 1, "Invalid public signals length");
        
        // Check that the stored hash matches the public input
        require(_pubSignals[0] == storedHashes[msg.sender], "Invalid stored hash");
        
        // Verify the ZK proof
        bool proofValid = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        
        if (proofValid) {
            successfulLogins[msg.sender]++;
            totalSuccessfulLogins++;
            success = true;
            emit UserLoggedIn(msg.sender, true, block.timestamp);
        } else {
            emit UserLoggedIn(msg.sender, false, block.timestamp);
        }
        
        return success;
    }

    /**
     * @dev Check if a user is registered
     * @param user Address to check
     * @return True if user is registered, false otherwise
     */
    function isRegistered(address user) external view returns (bool) {
        return storedHashes[user] != 0;
    }

    /**
     * @dev Get user statistics
     * @param user Address to get stats for
     * @return attempts Number of login attempts
     * @return successful Number of successful logins
     * @return registered True if user is registered
     * @return lastAttempt Timestamp of last login attempt
     * @return registrationTime Timestamp of registration
     */
    function getUserStats(address user) external view returns (
        uint256 attempts,
        uint256 successful,
        bool registered,
        uint256 lastAttempt,
        uint256 registrationTime
    ) {
        return (
            loginAttempts[user],
            successfulLogins[user],
            storedHashes[user] != 0,
            lastLoginAttempt[user],
            registrationTimestamp[user]
        );
    }

    /**
     * @dev Get global contract statistics
     * @return users Total number of registered users
     * @return attempts Total login attempts
     * @return successful Total successful logins
     * @return isPaused Current pause state
     */
    function getGlobalStats() external view returns (
        uint256 users,
        uint256 attempts,
        uint256 successful,
        bool isPaused
    ) {
        return (
            totalUsers,
            totalLoginAttempts,
            totalSuccessfulLogins,
            paused
        );
    }

    /**
     * @dev Emergency function to remove a user (admin only)
     * @param user Address to remove
     */
    function removeUser(address user) external onlyAdmin {
        require(storedHashes[user] != 0, "User not registered");
        
        delete storedHashes[user];
        delete loginAttempts[user];
        delete successfulLogins[user];
        delete lastLoginAttempt[user];
        delete registrationTimestamp[user];
        totalUsers--;
        
        emit UserRemoved(user, msg.sender, block.timestamp);
    }

    /**
     * @dev Transfer admin role
     * @param newAdmin Address of the new admin
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        require(newAdmin != admin, "New admin same as current");
        
        address oldAdmin = admin;
        admin = newAdmin;
        
        emit AdminTransferred(oldAdmin, newAdmin, block.timestamp);
    }

    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyAdmin {
        require(!paused, "Contract already paused");
        paused = true;
    }

    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyAdmin {
        require(paused, "Contract not paused");
        paused = false;
    }

    /**
     * @dev Reset user's login attempts (admin only)
     * @param user Address to reset
     */
    function resetUserAttempts(address user) external onlyAdmin {
        loginAttempts[user] = 0;
        lastLoginAttempt[user] = 0;
    }

    /**
     * @dev Check if user can attempt login (rate limiting)
     * @param user Address to check
     * @return canAttempt True if user can attempt login
     * @return reason Reason if cannot attempt
     */
    function canAttemptLogin(address user) external view returns (bool canAttempt, string memory reason) {
        if (storedHashes[user] == 0) {
            return (false, "User not registered");
        }
        
        if (paused) {
            return (false, "Contract is paused");
        }
        
        if (block.timestamp < lastLoginAttempt[user] + LOGIN_COOLDOWN) {
            return (false, "Login cooldown not met");
        }
        
        if (loginAttempts[user] >= MAX_DAILY_ATTEMPTS) {
            return (false, "Daily login attempts exceeded");
        }
        
        return (true, "Can attempt login");
    }
}
