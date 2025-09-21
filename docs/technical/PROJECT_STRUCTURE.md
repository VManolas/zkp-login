# Project Structure - zkSync ZKP Authentication dApp

**Version:** 2.0.0  
**Last Updated:** 2025-01-21

## 📁 Directory Overview

```
zksync-zzlogin-dapp-Sep-2025-b/
├── 📁 assets/                          # Static assets
│   ├── 📁 images/                      # Image files
│   └── 📁 icons/                       # Icon files
├── 📁 circuits/                        # ZK Circuit files
│   ├── 📄 login_auth.circom           # Main circuit definition
│   ├── 📄 input.json                  # Circuit input example
│   └── 📄 witness.wtns                # Generated witness
├── 📁 config/                         # Configuration files
│   ├── 📁 development/                # Development configs
│   │   ├── 📄 hardhat.config.ts      # Hardhat configuration
│   │   └── 📄 tsconfig.json          # TypeScript configuration
│   └── 📁 production/                 # Production configs
│       └── 📄 production-config.json # Production settings
├── 📁 contracts/                      # Smart contracts
│   ├── 📄 LoginAuth.sol              # Main authentication contract
│   └── 📄 Verifier.sol               # ZK proof verifier contract
├── 📁 deployments/                    # Deployment records
│   ├── 📄 zkSyncEraTestnet-*.json    # Testnet deployment records
│   └── 📄 mock-*.json                # Mock deployment records
├── 📁 docs/                          # Documentation
│   ├── 📁 fixes/                     # Bug fixes and issue resolution
│   │   ├── 📄 ROOT_CAUSE_ANALYSIS_FIX.md # Complete root cause analysis
│   │   ├── 📄 NETWORK_DETECTION_FIX.md # Network detection fixes
│   │   ├── 📄 L2_SIGNER_PROVIDER_FIX.md # L2 provider fixes
│   │   └── 📄 [other fix files...]   # Additional fix documentation
│   ├── 📁 technical/                 # Technical documentation
│   │   ├── 📄 PROJECT_STRUCTURE.md   # This file
│   │   ├── 📄 TEST_REPORT.md         # Test results and analysis
│   │   ├── 📄 PRODUCTION_DEPLOYMENT_SUMMARY.md # Deployment summary
│   │   ├── 📄 OPTIMIZATION_SUMMARY.md # Performance optimizations
│   │   ├── 📄 test-complete-flow.md  # Complete flow testing
│   │   └── 📄 README.md              # Circuit documentation (moved from circuits/)
│   ├── 📁 user-guides/               # User documentation
│   │   ├── 📄 USER_TESTING_GUIDE.md  # Comprehensive testing guide
│   │   ├── 📄 USER_TESTING_CHECKLIST.md # Testing checklist
│   │   ├── 📄 PRODUCTION_DEPLOYMENT_SUMMARY.md # User deployment guide
│   │   └── 📄 TEST_REPORT.md         # User testing report
│   ├── 📁 examples/                  # Example files and old documentation
│   │   ├── 📄 README_NEW.md          # New README version
│   │   ├── 📄 README_OLD.md          # Old README version
│   │   └── 📄 README.md              # Deployment package README
│   └── 📄 README.md                  # Documentation index
├── 📁 examples/                      # Example files and packages
│   ├── 📁 deployment/                # Deployment examples
│   │   └── 📁 deployment-package-*/  # Complete deployment packages
│   └── 📁 testing/                   # Testing examples
├── 📁 frontend/                      # React frontend application
│   ├── 📁 public/                    # Public assets
│   │   ├── 📁 circuits/              # Circuit files for frontend
│   │   │   ├── 📄 login_auth.wasm    # Circuit WASM file
│   │   │   ├── 📄 login_auth_final.zkey # Circuit proving key
│   │   │   └── 📄 verification_key.json # Verification key
│   │   ├── 📄 index.html             # Main HTML file
│   │   └── 📄 manifest.json          # PWA manifest
│   ├── 📁 src/                       # Source code
│   │   ├── 📁 components/            # React components
│   │   │   ├── 📄 LoginForm.tsx      # Login form component
│   │   │   ├── 📄 RegistrationForm.tsx # Registration form component
│   │   │   └── 📄 UserStats.tsx      # Statistics component
│   │   ├── 📁 config/                # Frontend configuration
│   │   │   └── 📄 contracts.json     # Contract addresses
│   │   ├── 📁 types/                 # TypeScript type definitions
│   │   │   └── 📄 index.ts           # Main type definitions
│   │   ├── 📁 utils/                 # Utility functions
│   │   │   ├── 📄 contracts.ts       # Contract interaction utilities
│   │   │   ├── 📄 poseidon.ts        # Poseidon hash utilities
│   │   │   └── 📄 zkProof.ts         # ZK proof utilities
│   │   ├── 📄 App.tsx                # Main application component
│   │   ├── 📄 App.css                # Application styles
│   │   └── 📄 index.tsx              # Application entry point
│   ├── 📁 build/                     # Production build output
│   ├── 📄 package.json               # Frontend dependencies
│   └── 📄 tsconfig.json              # TypeScript configuration
├── 📁 scripts/                       # Utility scripts
│   ├── 📁 deployment/                # Deployment scripts
│   │   ├── 📄 deploy.ts              # Main deployment script
│   │   ├── 📄 deploy-minimal.ts      # Minimal deployment
│   │   ├── 📄 deploy-simple.ts       # Simple deployment
│   │   ├── 📄 deploy-with-retry.ts   # Deployment with retry logic
│   │   ├── 📄 direct-deploy.ts       # Direct deployment
│   │   ├── 📄 simple-deploy.ts       # Simple deployment
│   │   ├── 📄 test-deploy.ts         # Test deployment
│   │   └── 📄 working-deploy.ts      # Working deployment
│   ├── 📁 testing/                   # Testing scripts
│   │   └── 📄 test-integration.ts    # Integration testing
│   └── 📁 utilities/                 # Utility scripts
│       ├── 📄 add-zkSync-network.js  # Add zkSync network to MetaMask
│       ├── 📄 check-wallet.js        # Wallet checking utility
│       ├── 📄 create-mock-deployment.js # Mock deployment creator
│       └── 📄 verify-network.js      # Network verification
├── 📁 test/                          # Test files
│   └── 📄 LoginAuth.test.ts          # Contract tests
├── 📁 build/                         # Circuit build output
│   ├── 📄 login_auth.r1cs            # R1CS constraint system
│   ├── 📄 login_auth.sym             # Symbol file
│   ├── 📄 login_auth_0000.zkey       # Initial proving key
│   ├── 📄 login_auth_0001.zkey       # Intermediate proving key
│   ├── 📄 login_auth_final.zkey      # Final proving key
│   ├── 📄 login_auth_js/             # JavaScript circuit files
│   ├── 📄 login_auth_cpp/            # C++ circuit files
│   ├── 📄 verification_key.json      # Verification key
│   ├── 📄 input.json                 # Test input
│   ├── 📄 witness.wtns               # Generated witness
│   ├── 📄 proof.json                 # Generated proof
│   └── 📄 public.json                # Public signals
├── 📄 .env.example                   # Environment variables example
├── 📄 .gitignore                     # Git ignore rules
├── 📄 package.json                   # Main project dependencies
├── 📄 package-lock.json              # Dependency lock file
├── 📄 powersOfTau15_final.ptau       # Powers of Tau file
├── 📄 README.md                      # Main project documentation
└── 📄 PROJECT_STRUCTURE.md           # This file
```

## 📋 Key Directories Explained

### 🎯 **Core Application**
- **`frontend/`** - React application with TypeScript
- **`contracts/`** - Solidity smart contracts
- **`circuits/`** - Circom ZK circuit definitions

### 📚 **Documentation**
- **`docs/user-guides/`** - User-facing documentation
- **`docs/technical/`** - Technical documentation and reports
- **`docs/deployment/`** - Deployment guides and scripts

### 🛠️ **Scripts and Utilities**
- **`scripts/deployment/`** - Contract deployment scripts
- **`scripts/testing/`** - Testing and validation scripts
- **`scripts/utilities/`** - Helper and utility scripts

### ⚙️ **Configuration**
- **`config/development/`** - Development environment configs
- **`config/production/`** - Production environment configs

### 📦 **Build and Deployment**
- **`build/`** - Circuit compilation output
- **`deployments/`** - Contract deployment records
- **`examples/deployment/`** - Complete deployment packages

## 🚀 Quick Navigation

### For Users
- **Getting Started:** `README.md`
- **Testing Guide:** `docs/user-guides/USER_TESTING_GUIDE.md`
- **Testing Checklist:** `docs/user-guides/USER_TESTING_CHECKLIST.md`

### For Developers
- **Technical Report:** `docs/technical/TEST_REPORT.md`
- **Deployment Guide:** `docs/deployment/deploy-production.sh`
- **Contract Tests:** `test/LoginAuth.test.ts`

### For Deployment
- **Production Config:** `config/production/production-config.json`
- **Docker Setup:** `docs/deployment/docker-compose.yml`
- **Systemd Service:** `docs/deployment/zkp-auth-app.service`

## 📁 File Naming Conventions

### Scripts
- **Deployment:** `deploy-*.ts`, `*-deploy.ts`
- **Testing:** `test-*.ts`, `*-test.ts`
- **Utilities:** `*-utility.js`, `check-*.js`

### Documentation
- **User Guides:** `USER_*.md`
- **Technical:** `*_REPORT.md`, `*_SUMMARY.md`
- **Deployment:** `deploy-*.sh`, `Dockerfile`

### Configuration
- **Development:** `hardhat.config.ts`, `tsconfig.json`
- **Production:** `production-config.json`

## 🔧 Maintenance

### Adding New Files
1. **Components:** Place in `frontend/src/components/`
2. **Utilities:** Place in `frontend/src/utils/` or `scripts/utilities/`
3. **Documentation:** Place in appropriate `docs/` subdirectory
4. **Scripts:** Place in appropriate `scripts/` subdirectory

### Updating Structure
1. Update this `PROJECT_STRUCTURE.md` file
2. Update main `README.md` if needed
3. Ensure all paths are correct in documentation

## 📊 Project Statistics

- **Total Directories:** 20+
- **Source Files:** 50+
- **Documentation Files:** 15+
- **Script Files:** 20+
- **Configuration Files:** 10+

## 🎯 Best Practices

1. **Keep root clean** - Only essential files in root directory
2. **Logical grouping** - Related files in same directory
3. **Clear naming** - Descriptive file and directory names
4. **Documentation** - Keep docs updated with structure changes
5. **Consistency** - Follow established naming conventions

---

**Last Updated:** 2025-01-21  
**Maintained By:** Development Team  
**Version:** 2.0.0
