# User Flows Documentation

**Date:** 2025-01-21  
**Version:** 2.0.0  
**Status:** ✅ **COMPLETE**

## 📋 **Overview**

This document provides comprehensive documentation of all available user flows in the zkSync Era ZKP Authentication dApp. The dApp implements zero-knowledge proof-based password authentication with smart contract integration.

## 🎯 **Available User Flows**

### **1. Wallet Connection Flow**

#### **Flow Description**
Users must connect their MetaMask wallet to access the dApp functionality.

#### **Steps**
1. **Initial State**: User sees welcome screen with "Connect Wallet" button
2. **Wallet Detection**: System checks for MetaMask installation
3. **Network Validation**: Ensures connection to zkSync Era Sepolia testnet (Chain ID: 300)
4. **Account Access**: Requests account access from MetaMask
5. **Connection Success**: Wallet connected, user status checked

#### **UI Elements**
- Welcome card with Shield icon
- "Connect Wallet" button with Wallet icon
- Loading spinner during connection
- Error messages for connection failures

#### **Success Criteria**
- ✅ Wallet connected successfully
- ✅ Connected to correct network (zkSync Era Sepolia)
- ✅ User address displayed
- ✅ User registration status checked

---

### **2. User Registration Flow**

#### **Flow Description**
New users register with a password that gets hashed and stored on-chain using Poseidon hashing.

#### **Steps**
1. **Access Registration**: User clicks "Register" tab
2. **Password Input**: User enters password with strength validation
3. **Password Confirmation**: User confirms password
4. **Strength Validation**: System validates password strength (minimum 50%)
5. **Hash Generation**: Password hashed using Poseidon hash function
6. **On-chain Registration**: Hash stored on zkSync Era Sepolia
7. **Status Update**: User status updated to registered

#### **UI Elements**
- Registration form with password fields
- Password strength indicator
- Password requirements checklist
- Show/hide password toggles
- Loading states and error messages

#### **Password Requirements**
- Minimum 8 characters
- Recommended 12+ characters
- Uppercase letters
- Numbers
- Special characters
- Strength score ≥ 50%

#### **Success Criteria**
- ✅ Password meets strength requirements
- ✅ Passwords match
- ✅ Hash generated successfully
- ✅ Transaction confirmed on-chain
- ✅ User marked as registered
- ✅ Redirected to login tab

---

### **3. ZK Proof Login Flow**

#### **Flow Description**
Registered users login using zero-knowledge proofs without revealing their password.

#### **Steps**
1. **Access Login**: User clicks "Login" tab
2. **Password Input**: User enters their password
3. **Hash Retrieval**: System retrieves stored hash from contract
4. **ZK Proof Generation**: Generates zero-knowledge proof using SnarkJS
5. **Circuit Execution**: Uses Circom circuit for proof generation
6. **On-chain Verification**: Proof verified on zkSync Era Sepolia
7. **Login Success**: User authenticated successfully

#### **UI Elements**
- Login form with password field
- Show/hide password toggle
- Loading states for proof generation
- Error messages for failed attempts
- Rate limiting warnings

#### **Technical Process**
1. **Input Preparation**: Password converted to BigInt format
2. **Circuit Input**: Prepared for Circom circuit
3. **Witness Generation**: Using login_auth.wasm
4. **Proof Generation**: Using Groth16 with SnarkJS
5. **Proof Formatting**: Converted for smart contract
6. **Contract Call**: Login function called with proof

#### **Success Criteria**
- ✅ Password entered correctly
- ✅ ZK proof generated successfully
- ✅ Proof verified on-chain
- ✅ User marked as logged in
- ✅ Statistics updated

---

### **4. Password Change Flow**

#### **Flow Description**
Registered users can change their password by generating a new hash and updating it on-chain.

#### **Steps**
1. **Access Change Password**: User clicks "Register" tab (shows change password form)
2. **New Password Input**: User enters new password
3. **Password Confirmation**: User confirms new password
4. **Strength Validation**: System validates new password strength
5. **Hash Generation**: New password hashed using Poseidon
6. **On-chain Update**: New hash stored on zkSync Era Sepolia
7. **Status Refresh**: User status updated

#### **UI Elements**
- Same as registration form
- "You are already registered" message
- Password change specific messaging

#### **Success Criteria**
- ✅ New password meets requirements
- ✅ Passwords match
- ✅ New hash generated
- ✅ Transaction confirmed on-chain
- ✅ User status refreshed

---

### **5. Statistics Display Flow**

#### **Flow Description**
Users can view their personal statistics and global system statistics.

#### **Steps**
1. **Access Statistics**: User clicks "Statistics" tab
2. **Data Retrieval**: System fetches user and global stats from contract
3. **Data Display**: Statistics displayed in organized sections

#### **User Statistics**
- Login attempts count
- Successful logins count
- Success rate percentage
- Last login attempt time
- Registration date
- Registration status

#### **Global Statistics**
- Total users count
- Total attempts count
- Successful logins count
- System status (Active/Paused)

#### **UI Elements**
- Statistics grid layout
- User stats section
- Global stats section
- Account information section
- Time formatting utilities

#### **Success Criteria**
- ✅ Statistics loaded successfully
- ✅ Data displayed correctly
- ✅ Time formatting working
- ✅ Real-time updates after actions

---

### **6. Wallet Disconnection Flow**

#### **Flow Description**
Users can disconnect their wallet and return to the initial state.

#### **Steps**
1. **Access Disconnect**: User clicks "Disconnect" button
2. **State Reset**: All user state cleared
3. **Return to Welcome**: User returned to welcome screen

#### **UI Elements**
- Disconnect button in header
- Confirmation toast message
- Return to welcome screen

#### **Success Criteria**
- ✅ User state cleared
- ✅ Returned to welcome screen
- ✅ Wallet disconnected

---

## 🔄 **Flow State Management**

### **Application States**
1. **Not Connected**: Welcome screen, no wallet connected
2. **Connected, Not Registered**: Wallet connected, user not registered
3. **Connected, Registered, Not Logged In**: User registered but not logged in
4. **Connected, Registered, Logged In**: User fully authenticated

### **State Transitions**
```
Not Connected → Connect Wallet → Connected, Not Registered
Connected, Not Registered → Register → Connected, Registered, Not Logged In
Connected, Registered, Not Logged In → Login → Connected, Registered, Logged In
Connected, Registered, Logged In → Logout → Connected, Registered, Not Logged In
Any State → Disconnect → Not Connected
```

## 🛡️ **Security Features**

### **Zero-Knowledge Proofs**
- Password never transmitted or stored in plaintext
- ZK proofs prove knowledge without revealing password
- On-chain verification using Groth16

### **Password Security**
- Poseidon hash function (ZK-friendly)
- Strong password requirements
- Client-side validation

### **Rate Limiting**
- Login attempt restrictions
- Cooldown periods for failed attempts
- System pause functionality

### **Network Security**
- zkSync Era Sepolia testnet only
- Network validation before transactions
- Automatic network switching

## 📱 **User Experience Features**

### **Accessibility**
- WCAG compliant form labels
- Screen reader support
- Keyboard navigation
- High contrast indicators

### **Visual Feedback**
- Loading spinners for all operations
- Success/error toast notifications
- Password strength indicators
- Real-time form validation

### **Error Handling**
- Comprehensive error messages
- Retry mechanisms for transient failures
- User-friendly error descriptions
- Network error handling

## 🔧 **Technical Implementation**

### **Frontend Technologies**
- React 18 with TypeScript
- zksync-ethers for blockchain interaction
- SnarkJS for ZK proof generation
- React Hot Toast for notifications

### **Smart Contract Integration**
- LoginAuth contract for user management
- Verifier contract for proof verification
- Event listening for real-time updates

### **ZK Circuit Integration**
- Circom circuit for proof generation
- WASM files for witness generation
- ZKey files for proof generation

## 📊 **Performance Metrics**

### **Expected Performance**
- Wallet connection: < 2 seconds
- Registration: < 30 seconds
- Login (ZK proof): < 10 seconds
- Password change: < 30 seconds
- Statistics loading: < 3 seconds

### **Optimization Features**
- Lazy loading of ZK circuit files
- Efficient state management
- Minimal re-renders
- Optimized contract calls

---

**Status:** ✅ **DOCUMENTATION COMPLETE**  
**Last Updated:** 2025-01-21  
**Version:** 2.0.0



