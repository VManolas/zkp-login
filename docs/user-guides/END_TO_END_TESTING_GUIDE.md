# End-to-End Testing Guide

**Date:** 2025-01-21  
**Version:** 2.0.0  
**Status:** ✅ **READY FOR TESTING**

## 🎯 **Testing Overview**

This guide provides step-by-step instructions for comprehensive end-to-end testing of the zkSync Era ZKP Authentication dApp. Follow these tests to verify all user flows and functionality.

## 📋 **Prerequisites**

### **Required Setup**
- ✅ MetaMask wallet installed and configured
- ✅ zkSync Era Sepolia testnet added to MetaMask
- ✅ Test ETH on zkSync Era Sepolia (minimum 0.1 ETH)
- ✅ dApp running at http://localhost:3000
- ✅ Browser developer tools open (F12)

### **Test Environment**
- **Network**: zkSync Era Sepolia Testnet (Chain ID: 300)
- **RPC URL**: https://sepolia.era.zksync.dev
- **Block Explorer**: https://sepolia-era.zksync.network
- **Contract Addresses**:
  - Verifier: `0x47D954fb1e51ae1C1BA6c85BBfcD87B9659326E5`
  - LoginAuth: `0xeC0af5d83AAFA45e2C945BA2ee2E0fedc1dAE9e4`

## 🧪 **Test Scenarios**

### **Test 1: Wallet Connection Flow**

#### **Objective**
Verify wallet connection and network validation.

#### **Steps**
1. **Open dApp**: Navigate to http://localhost:3000
2. **Verify Welcome Screen**: Should see welcome card with Shield icon
3. **Check Connect Button**: "Connect Wallet" button should be visible
4. **Click Connect Wallet**: Click the connect button
5. **MetaMask Popup**: MetaMask should open requesting connection
6. **Approve Connection**: Click "Connect" in MetaMask
7. **Network Check**: Verify connected to zkSync Era Sepolia (Chain ID: 300)
8. **Verify Connection**: Should see wallet address and status indicators

#### **Expected Results**
- ✅ Welcome screen displayed initially
- ✅ MetaMask popup appears
- ✅ Connection successful
- ✅ Connected to correct network
- ✅ Wallet address displayed
- ✅ Status indicators show connection state

#### **Error Scenarios to Test**
- MetaMask not installed
- Wrong network selected
- User rejects connection
- Network switching fails

---

### **Test 2: User Registration Flow**

#### **Objective**
Verify user registration with password hashing and on-chain storage.

#### **Steps**
1. **Access Registration**: Click "Register" tab
2. **Enter Weak Password**: Try "123" (should fail validation)
3. **Enter Strong Password**: Use "TestPassword123!" (meets requirements)
4. **Confirm Password**: Enter same password again
5. **Verify Strength Indicator**: Should show "Strong" with green bar
6. **Check Requirements**: All requirements should be met
7. **Click Register**: Submit the form
8. **Monitor Transaction**: Watch MetaMask for transaction
9. **Approve Transaction**: Confirm in MetaMask
10. **Wait for Confirmation**: Wait for transaction to be mined
11. **Verify Success**: Should see success message and redirect to login

#### **Expected Results**
- ✅ Password validation working
- ✅ Strength indicator accurate
- ✅ Requirements checklist functional
- ✅ Transaction submitted successfully
- ✅ Transaction confirmed on-chain
- ✅ User marked as registered
- ✅ Redirected to login tab

#### **Test Passwords**
- **Weak**: "123" (should fail)
- **Medium**: "password123" (should work)
- **Strong**: "TestPassword123!" (should work)
- **Very Strong**: "MySecure@Password#2025!" (should work)

---

### **Test 3: ZK Proof Login Flow**

#### **Objective**
Verify zero-knowledge proof login functionality.

#### **Steps**
1. **Access Login**: Click "Login" tab
2. **Enter Correct Password**: Use the password from registration
3. **Click Login**: Submit the form
4. **Monitor ZK Generation**: Watch console for proof generation
5. **Monitor Transaction**: Watch MetaMask for verification transaction
6. **Approve Transaction**: Confirm in MetaMask
7. **Wait for Verification**: Wait for on-chain verification
8. **Verify Success**: Should see success message and login state

#### **Expected Results**
- ✅ ZK proof generated successfully
- ✅ Proof verified on-chain
- ✅ Login successful
- ✅ User marked as logged in
- ✅ Statistics updated

#### **Error Scenarios to Test**
- Wrong password
- Network issues during proof generation
- Transaction failure
- Rate limiting

---

### **Test 4: Password Change Flow**

#### **Objective**
Verify password change functionality for registered users.

#### **Steps**
1. **Access Change Password**: Click "Register" tab (should show change password form)
2. **Verify Message**: Should see "You are already registered" message
3. **Enter New Password**: Use "NewPassword456!"
4. **Confirm New Password**: Enter same password
5. **Verify Strength**: Should show strong password indicator
6. **Click Change Password**: Submit the form
7. **Monitor Transaction**: Watch MetaMask for transaction
8. **Approve Transaction**: Confirm in MetaMask
9. **Wait for Confirmation**: Wait for transaction to be mined
10. **Verify Success**: Should see success message

#### **Expected Results**
- ✅ Change password form displayed
- ✅ New password validation working
- ✅ Transaction submitted successfully
- ✅ Password changed on-chain
- ✅ Success message displayed

---

### **Test 5: Statistics Display Flow**

#### **Objective**
Verify statistics display and real-time updates.

#### **Steps**
1. **Access Statistics**: Click "Statistics" tab
2. **Check User Stats**: Verify personal statistics are displayed
3. **Check Global Stats**: Verify global statistics are displayed
4. **Check Account Info**: Verify wallet address is shown
5. **Perform Action**: Go back and perform a login
6. **Return to Stats**: Check if statistics updated
7. **Verify Time Formatting**: Check timestamp formatting

#### **Expected Results**
- ✅ User statistics displayed correctly
- ✅ Global statistics displayed correctly
- ✅ Account information shown
- ✅ Statistics update after actions
- ✅ Time formatting working properly

---

### **Test 6: Error Handling and Edge Cases**

#### **Objective**
Verify error handling and edge case scenarios.

#### **Test Cases**

##### **6.1 Network Errors**
1. Switch to wrong network (e.g., Ethereum Mainnet)
2. Try to connect wallet
3. Verify error message and network switching

##### **6.2 Transaction Failures**
1. Set very low gas limit in MetaMask
2. Try to register
3. Verify error handling

##### **6.3 Insufficient Funds**
1. Use wallet with no ETH
2. Try to register
3. Verify error message

##### **6.4 User Rejection**
1. Reject MetaMask connection
2. Reject transaction
3. Verify error handling

##### **6.5 Rate Limiting**
1. Perform multiple rapid login attempts
2. Verify rate limiting works
3. Check retry timers

#### **Expected Results**
- ✅ Appropriate error messages displayed
- ✅ User can recover from errors
- ✅ Network switching works
- ✅ Rate limiting functional

---

## 🔍 **Testing Checklist**

### **Pre-Test Setup**
- [ ] MetaMask installed and configured
- [ ] zkSync Era Sepolia added to MetaMask
- [ ] Test ETH available (minimum 0.1 ETH)
- [ ] dApp running on localhost:3000
- [ ] Browser developer tools open
- [ ] Console logging enabled

### **Wallet Connection Tests**
- [ ] Welcome screen displays correctly
- [ ] Connect wallet button works
- [ ] MetaMask popup appears
- [ ] Connection successful
- [ ] Correct network detected
- [ ] Wallet address displayed
- [ ] Status indicators working

### **Registration Tests**
- [ ] Registration form accessible
- [ ] Password validation working
- [ ] Strength indicator accurate
- [ ] Requirements checklist functional
- [ ] Transaction submission successful
- [ ] On-chain confirmation
- [ ] Success message displayed
- [ ] Redirect to login works

### **Login Tests**
- [ ] Login form accessible
- [ ] ZK proof generation working
- [ ] Proof verification successful
- [ ] Login state updated
- [ ] Statistics updated
- [ ] Error handling for wrong password

### **Password Change Tests**
- [ ] Change password form accessible
- [ ] New password validation working
- [ ] Transaction submission successful
- [ ] Password updated on-chain
- [ ] Success message displayed

### **Statistics Tests**
- [ ] Statistics tab accessible
- [ ] User stats displayed correctly
- [ ] Global stats displayed correctly
- [ ] Account info shown
- [ ] Real-time updates working
- [ ] Time formatting correct

### **Error Handling Tests**
- [ ] Network error handling
- [ ] Transaction failure handling
- [ ] Insufficient funds handling
- [ ] User rejection handling
- [ ] Rate limiting working

## 📊 **Performance Testing**

### **Response Times**
- Wallet connection: < 2 seconds
- Registration: < 30 seconds
- Login (ZK proof): < 10 seconds
- Password change: < 30 seconds
- Statistics loading: < 3 seconds

### **Resource Usage**
- Memory usage during ZK proof generation
- Network requests efficiency
- Contract call optimization

## 🐛 **Common Issues and Solutions**

### **Issue: MetaMask Not Detected**
**Solution**: Ensure MetaMask is installed and enabled

### **Issue: Wrong Network**
**Solution**: Switch to zkSync Era Sepolia (Chain ID: 300)

### **Issue: Transaction Failed**
**Solution**: Check gas limit and try again

### **Issue: ZK Proof Generation Failed**
**Solution**: Check circuit files are accessible

### **Issue: Contract Call Failed**
**Solution**: Verify contract addresses and network

## 📝 **Test Reporting**

### **Test Results Template**
```
Test Date: [DATE]
Tester: [NAME]
Environment: [BROWSER/OS]
Network: zkSync Era Sepolia

Test Results:
- Wallet Connection: [PASS/FAIL]
- Registration: [PASS/FAIL]
- Login: [PASS/FAIL]
- Password Change: [PASS/FAIL]
- Statistics: [PASS/FAIL]
- Error Handling: [PASS/FAIL]

Issues Found:
- [ISSUE 1]
- [ISSUE 2]

Performance:
- Average response times: [TIMES]
- Resource usage: [USAGE]

Overall Status: [PASS/FAIL]
```

---

**Status:** ✅ **TESTING GUIDE COMPLETE**  
**Last Updated:** 2025-01-21  
**Version:** 2.0.0



