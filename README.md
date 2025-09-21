# zkSync Era ZKP Login dApp - Production Ready

A fully optimized Zero-Knowledge Proof (ZKP) authentication dApp built on zkSync Era, featuring efficient password hashing, streamlined contract interactions, and enhanced user experience.

## 🎯 Project Status

**Status:** ✅ **PRODUCTION READY**  
**Version:** 2.0.0  
**Last Updated:** 2025-01-21

## 📚 Documentation

All project documentation is organized in the `/docs` directory:

- **🔧 Fixes**: Bug fixes and issue resolution (`/docs/fixes/`)
- **🔬 Technical**: Technical documentation and project structure (`/docs/technical/`)
- **👥 User Guides**: User-facing documentation (`/docs/user-guides/`)
- **📚 Examples**: Example files and old documentation (`/docs/examples/`)

**Quick Links:**
- [Complete Fix History](/docs/fixes/ROOT_CAUSE_ANALYSIS_FIX.md)
- [Project Structure](/docs/technical/PROJECT_STRUCTURE.md)
- [User Testing Guide](/docs/user-guides/USER_TESTING_GUIDE.md)
- [Production Deployment](/docs/technical/PRODUCTION_DEPLOYMENT_SUMMARY.md)

**Auto-Organization:** Use `./scripts/organize-docs.sh` to automatically organize new markdown files into the docs directory (preserves README.md files in their original locations).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- zkSync Era Sepolia testnet ETH

### Installation
```bash
npm install
npm run frontend:install
npm run circuit:setup-full
```

### Development
```bash
npm run dev
```

### Production Deployment
```bash
# Run the production deployment script
./docs/deployment/deploy-production.sh

# Or use Docker
docker-compose up -d
```

## 📁 Project Structure

For detailed project structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

### Key Directories
- **`frontend/`** - React application with TypeScript
- **`contracts/`** - Smart contracts (Solidity)
- **`circuits/`** - ZK circuits (Circom)
- **`docs/`** - Comprehensive documentation
- **`scripts/`** - Utility and deployment scripts
- **`config/`** - Configuration files

## 🌟 Features

### Core Functionality
- **Zero-Knowledge Authentication** - Password never revealed
- **Poseidon Hashing** - ZK-friendly hash function
- **Smart Contract Integration** - Deployed on zkSync Era
- **Real-time Statistics** - User and global metrics

### User Experience
- **Modern UI** - Beautiful, responsive interface
- **Password Strength** - Visual feedback and validation
- **Error Handling** - Comprehensive error management
- **Mobile Support** - Works on all devices

### Security
- **Rate Limiting** - Prevents brute force attacks
- **Input Validation** - Robust validation throughout
- **ZK Proofs** - Mathematically secure authentication
- **Admin Controls** - Emergency pause functionality

## 📚 Documentation

### User Guides
- [User Testing Guide](./docs/user-guides/USER_TESTING_GUIDE.md)
- [User Testing Checklist](./docs/user-guides/USER_TESTING_CHECKLIST.md)

### Technical Documentation
- [Test Report](./docs/technical/TEST_REPORT.md)
- [Production Deployment Summary](./docs/technical/PRODUCTION_DEPLOYMENT_SUMMARY.md)
- [Project Structure](./PROJECT_STRUCTURE.md)

### Deployment
- [Deployment Instructions](./docs/deployment/deploy-production.sh)
- [Docker Configuration](./docs/deployment/docker-compose.yml)
- [Systemd Service](./docs/deployment/zkp-auth-app.service)

## 🔧 Configuration

### Contract Addresses
- **Verifier:** `0x47D954fb1e51ae1C1BA6c85BBfcD87B9659326E5`
- **LoginAuth:** `0xeC0af5d83AAFA45e2C945BA2ee2E0fedc1dAE9e4`
- **Network:** zkSync Era Sepolia Testnet

### Environment Variables
See [.env.example](./.env.example) for required environment variables.

## 🧪 Testing

### User Testing
1. Open http://localhost:3000
2. Connect MetaMask wallet
3. Switch to zkSync Era Sepolia testnet
4. Follow the [User Testing Guide](./docs/user-guides/USER_TESTING_GUIDE.md)

### Automated Testing
```bash
npm run test
npm run frontend:test
npm run test:integration
```

## 🚀 Deployment Options

### Option 1: Direct Serve
```bash
npx serve -s frontend/build -l 3000
```

### Option 2: Docker
```bash
docker-compose up -d
```

### Option 3: Systemd Service
```bash
sudo systemctl enable zkp-auth-app.service
sudo systemctl start zkp-auth-app.service
```

## 📊 Performance Metrics

- **Page Load:** < 3 seconds
- **Wallet Connection:** < 2 seconds
- **Registration:** < 30 seconds
- **Login:** < 10 seconds
- **ZK Proof Generation:** < 5 seconds

## 🛠️ Development

### Scripts
- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run deploy`** - Deploy contracts
- **`npm run circuit:setup-full`** - Setup ZK circuits

### Code Structure
- **Frontend:** React + TypeScript
- **Contracts:** Solidity 0.8.19
- **Circuits:** Circom 2.0.0
- **ZK Proofs:** Groth16 with Poseidon

## 🔒 Security

### ZK Proof Security
- **Poseidon Hashing** - ZK-friendly hash function
- **Groth16 Proofs** - Cryptographically secure
- **Circuit Verification** - On-chain proof verification

### Smart Contract Security
- **Access Control** - Only registered users can login
- **Rate Limiting** - Prevents brute force attacks
- **Admin Controls** - Emergency pause functionality

## 📈 Statistics

The application tracks comprehensive statistics:
- **User Stats:** Login attempts, successes, registration time
- **Global Stats:** Total users, attempts, system status
- **Real-time Updates:** Statistics update after each action

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- Check the [docs/](./docs/) directory for comprehensive guides
- See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for file organization

### Issues
- Report issues via the issue tracker
- Check existing issues before creating new ones

### Testing
- Follow the [User Testing Guide](./docs/user-guides/USER_TESTING_GUIDE.md)
- Use the [Testing Checklist](./docs/user-guides/USER_TESTING_CHECKLIST.md)

## 🎉 Acknowledgments

- **zkSync Team** - For the amazing zkSync Era platform
- **Circom Team** - For the ZK circuit language
- **SnarkJS** - For ZK proof generation
- **React Team** - For the excellent frontend framework

---

**Ready for Production** ✅  
**Last Updated:** 2025-01-21  
**Version:** 2.0.0
