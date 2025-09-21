# LoginAuth Circuit

This directory contains the Circom circuit for the zero-knowledge password authentication system.

## Circuit Overview

The `login_auth.circom` circuit implements a zero-knowledge proof system that allows users to prove they know a password without revealing it.

### Inputs

- **Private Input**: `password` - The user's password (kept secret)
- **Public Input**: `storedHash` - The hash stored on-chain during registration

### Outputs

- **isValid** - 1 if the password hashes to the stored hash, 0 otherwise

### Security Features

- Uses Poseidon hash function for ZK-friendly hashing
- Password remains private throughout proof generation
- Only the validation result is revealed
- Optimized for gas efficiency

## Compilation

To compile the circuit:

```bash
npm run circuit:compile
```

This will generate:
- `login_auth.r1cs` - R1CS constraint system
- `login_auth.wasm` - WebAssembly file for witness generation
- `login_auth.sym` - Symbol file for debugging
- `login_auth.cpp` - C++ witness generator

## Setup

To set up the trusted setup ceremony:

```bash
npm run circuit:setup-full
```

This will:
1. Generate the initial zkey file
2. Run the contribution ceremony
3. Generate the final zkey file
4. Export the verifier contract

## Dependencies

- circomlib: For Poseidon hash function
- snarkjs: For proof generation and verification

