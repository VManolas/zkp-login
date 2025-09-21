# User Testing Guide - zkSync ZKP Authentication dApp

**Version:** 2.0.0  
**Date:** 2025-01-20  
**Status:** Production Ready

## Overview

This guide provides comprehensive instructions for testing the zkSync ZKP authentication dApp. The application demonstrates zero-knowledge password authentication on zkSync Era testnet.

## Prerequisites

### Required Setup
1. **MetaMask Wallet**
   - Install MetaMask browser extension
   - Create or import a wallet
   - Add zkSync Era Sepolia testnet

2. **Testnet ETH**
   - Get testnet ETH from zkSync Era Sepolia faucet
   - Recommended: 0.1-0.5 ETH for testing

3. **Browser Requirements**
   - Modern browser (Chrome, Firefox, Safari, Edge)
   - JavaScript enabled
   - MetaMask extension installed

### Network Configuration

**zkSync Era Sepolia Testnet:**
- **Network Name:** zkSync Era Sepolia Testnet
- **RPC URL:** https://sepolia.era.zksync.dev
- **Chain ID:** 300
- **Currency Symbol:** ETH
- **Block Explorer:** https://sepolia-era.zksync.network

## Testing Scenarios

### Scenario 1: Initial Setup and Wallet Connection

**Objective:** Verify wallet connection and network setup

**Steps:**
1. Open the application at http://localhost:3000
2. Click "Connect Wallet" button
3. Select MetaMask when prompted
4. Approve the connection request
5. Verify the wallet address is displayed
6. Check that the status shows "Connected: ✅"

**Expected Results:**
- Wallet connects successfully
- Address is displayed correctly
- Network is zkSync Era Sepolia testnet
- Status indicators show connected state

**Common Issues:**
- **Wrong Network:** Ensure MetaMask is on zkSync Era Sepolia testnet
- **Connection Failed:** Check MetaMask is unlocked and extension is enabled
- **No Address:** Refresh page and try again

### Scenario 2: User Registration

**Objective:** Test user registration with password hashing

**Prerequisites:**
- Wallet connected
- Sufficient testnet ETH balance

**Steps:**
1. Navigate to "Register" tab
2. Enter a strong password (minimum 8 characters)
3. Confirm the password
4. Observe password strength indicator
5. Click "Register" button
6. Approve the transaction in MetaMask
7. Wait for transaction confirmation
8. Verify registration status changes to "Registered: ✅"

**Password Requirements:**
- Minimum 8 characters
- Recommended: 12+ characters
- Mix of uppercase, lowercase, numbers, special characters

**Expected Results:**
- Password strength indicator shows "Strong"
- Registration transaction succeeds
- User status updates to registered
- Statistics show registration time

**Common Issues:**
- **Insufficient Funds:** Get more testnet ETH
- **Transaction Failed:** Check network connection
- **Weak Password:** Use stronger password

### Scenario 3: ZK Proof Login

**Objective:** Test zero-knowledge proof authentication

**Prerequisites:**
- User registered
- Same password used for registration

**Steps:**
1. Navigate to "Login" tab
2. Enter the same password used for registration
3. Click "Login" button
4. Wait for ZK proof generation (3-5 seconds)
5. Wait for on-chain verification
6. Verify login success

**Expected Results:**
- ZK proof generates successfully
- On-chain verification succeeds
- Login status shows "Logged In: ✅"
- User statistics update

**Common Issues:**
- **Wrong Password:** Use exact same password as registration
- **Proof Generation Failed:** Check circuit files are accessible
- **Verification Failed:** Ensure password matches stored hash

### Scenario 4: Password Change

**Objective:** Test password change functionality

**Prerequisites:**
- User registered and logged in

**Steps:**
1. Navigate to "Register" tab (shows password change for registered users)
2. Enter new strong password
3. Confirm new password
4. Click "Change Password" button
5. Approve transaction in MetaMask
6. Wait for confirmation
7. Test login with new password

**Expected Results:**
- Password change transaction succeeds
- Old password no longer works
- New password works for login
- Statistics update with change time

### Scenario 5: Statistics and Monitoring

**Objective:** Verify statistics tracking

**Steps:**
1. Navigate to "Statistics" tab
2. Review user statistics:
   - Login attempts
   - Successful logins
   - Registration time
   - Last attempt time
3. Review global statistics:
   - Total users
   - Total attempts
   - Total successful logins
   - System status

**Expected Results:**
- Statistics display correctly
- Numbers update after actions
- Real-time data accuracy

### Scenario 6: Error Handling

**Objective:** Test error scenarios and recovery

**Test Cases:**

**A. Wrong Password Login**
1. Try logging in with wrong password
2. Verify error message appears
3. Verify login attempt is recorded

**B. Unregistered User Login**
1. Disconnect wallet
2. Connect different wallet (not registered)
3. Try to login
4. Verify appropriate error message

**C. Network Issues**
1. Disconnect from internet
2. Try to perform actions
3. Verify error handling
4. Reconnect and verify recovery

**D. Insufficient Funds**
1. Use wallet with no ETH
2. Try to register
3. Verify error message
4. Add funds and retry

## Performance Testing

### Load Testing
- **Multiple Users:** Test with 5-10 concurrent users
- **Rapid Actions:** Perform quick successive actions
- **Large Passwords:** Test with very long passwords

### Performance Metrics
- **Wallet Connection:** < 2 seconds
- **Registration:** < 30 seconds (including transaction)
- **Login:** < 10 seconds (including proof generation)
- **Page Load:** < 3 seconds

## Security Testing

### ZK Proof Verification
1. **Proof Validity:** Verify proofs are mathematically valid
2. **Password Privacy:** Confirm password is never transmitted
3. **Hash Consistency:** Verify same password produces same hash

### Contract Security
1. **Access Control:** Verify only registered users can login
2. **Rate Limiting:** Test attempt limits
3. **Admin Functions:** Verify admin controls work

## Browser Compatibility

### Tested Browsers
- **Chrome:** 90+ ✅
- **Firefox:** 88+ ✅
- **Safari:** 14+ ✅
- **Edge:** 90+ ✅

### Mobile Testing
- **iOS Safari:** Test on iPhone/iPad
- **Android Chrome:** Test on Android devices
- **Responsive Design:** Verify mobile UI works

## Reporting Issues

### Issue Categories
1. **Critical:** Application doesn't load, wallet connection fails
2. **High:** Registration/login fails, incorrect behavior
3. **Medium:** UI issues, performance problems
4. **Low:** Minor UI improvements, documentation

### Issue Report Template
```
**Issue Title:** Brief description
**Severity:** Critical/High/Medium/Low
**Browser:** Chrome 95, Firefox 89, etc.
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** What should happen
**Actual Result:** What actually happened
**Screenshots:** If applicable
**Console Errors:** Any error messages
```

## Success Criteria

### Must Have (Critical)
- ✅ Wallet connection works
- ✅ Registration completes successfully
- ✅ Login with ZK proof works
- ✅ Password change works
- ✅ Statistics display correctly

### Should Have (Important)
- ✅ Responsive design works
- ✅ Error messages are clear
- ✅ Performance is acceptable
- ✅ Works on multiple browsers

### Nice to Have (Enhancement)
- ✅ Mobile optimization
- ✅ Advanced error recovery
- ✅ Enhanced UI/UX
- ✅ Additional features

## Test Data

### Test Accounts
- **Primary:** Use your main test wallet
- **Secondary:** Create additional test wallets
- **Edge Cases:** Test with various password types

### Test Passwords
- **Simple:** `password123`
- **Complex:** `MyStr0ng!P@ssw0rd2024`
- **Very Long:** `ThisIsAVeryLongPasswordThatExceedsNormalLength123456789`
- **Special Chars:** `P@ssw0rd!@#$%^&*()`

## Conclusion

This testing guide ensures comprehensive validation of the zkSync ZKP authentication dApp. Follow all scenarios to verify the system works correctly and securely.

**Remember:** This is a testnet application. Use only testnet ETH and test data.

---

**For Support:** Refer to TEST_REPORT.md for technical details  
**Documentation:** See README.md for setup instructions  
**Issues:** Report via the issue tracking system
