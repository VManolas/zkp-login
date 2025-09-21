# Production Deployment Instructions

## Quick Start

1. **Serve the frontend:**
   ```bash
   # Using Node.js serve
   npx serve -s build -l 3000
   
   # Or using Python
   python -m http.server 3000 -d build
   
   # Or using any static file server
   ```

2. **Access the application:**
   - URL: http://localhost:3000
   - Network: zkSync Era Sepolia Testnet
   - Wallet: MetaMask required

## Configuration

- **Contract Addresses:** See production-config.json
- **Network:** zkSync Era Sepolia Testnet
- **RPC:** https://sepolia.era.zksync.dev
- **Block Explorer:** https://sepolia-era.zksync.network

## Requirements

- MetaMask wallet
- zkSync Era Sepolia testnet ETH
- Modern web browser

## Features

- Zero-knowledge password authentication
- Wallet connection
- User registration and login
- Statistics tracking
- Responsive UI

## Support

For issues or questions, refer to TEST_REPORT.md
