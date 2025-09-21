// ZK Proof generation utilities
// Real implementation using snarkjs and the actual circuit

import * as snarkjs from 'snarkjs';
import { ethers } from 'ethers';

export interface ZKProofInputs {
  password: string;
  storedHash: string;
}

export interface ZKProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
}

export interface ZKProofResult {
  proof: ZKProof;
  publicSignals: string[];
}

/**
 * Generate a ZK proof for password verification
 * Real implementation using snarkjs and the actual circuit
 */
export async function generateZKProof(inputs: ZKProofInputs): Promise<ZKProofResult> {
  try {
    // Validate inputs
    if (!inputs.password || !inputs.storedHash) {
      throw new Error('Invalid inputs for proof generation');
    }

    // For ZK proof, we don't pre-validate the password
    // The circuit will handle the verification internally
    // We just need to prepare the inputs for the circuit

    // Convert password to BigInt using the same method as Poseidon hash
    const passwordBytes = ethers.toUtf8Bytes(inputs.password);
    const passwordBigInt = BigInt(ethers.hexlify(passwordBytes));
    
    // Prepare circuit input
    const circuitInput = {
      password: passwordBigInt.toString(),
      storedHash: inputs.storedHash
    };

    // Load the circuit files
    const wasmPath = '/circuits/login_auth.wasm';
    const zkeyPath = '/circuits/login_auth_final.zkey';

    // Generate witness and proof using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    // Convert proof to the expected format
    const formattedProof: ZKProof = {
      pi_a: [
        proof.pi_a[0].toString(),
        proof.pi_a[1].toString()
      ],
      pi_b: [
        [
          proof.pi_b[0][0].toString(),
          proof.pi_b[0][1].toString()
        ],
        [
          proof.pi_b[1][0].toString(),
          proof.pi_b[1][1].toString()
        ]
      ],
      pi_c: [
        proof.pi_c[0].toString(),
        proof.pi_c[1].toString()
      ]
    };

    // Convert public signals to strings
    const formattedPublicSignals = publicSignals.map(signal => signal.toString());

    return {
      proof: formattedProof,
      publicSignals: formattedPublicSignals
    };
  } catch (error) {
    console.error('Error generating ZK proof:', error);
    throw new Error('Failed to generate ZK proof');
  }
}

/**
 * Format proof for contract interaction
 * Converts the proof object to the format expected by the smart contract
 */
export function formatProofForContract(proof: ZKProof): any {
  try {
    // Format proof according to the Groth16Verifier contract format
    return {
      pi_a: [
        BigInt(proof.pi_a[0]),
        BigInt(proof.pi_a[1])
      ],
      pi_b: [
        [
          BigInt(proof.pi_b[0][0]),
          BigInt(proof.pi_b[0][1])
        ],
        [
          BigInt(proof.pi_b[1][0]),
          BigInt(proof.pi_b[1][1])
        ]
      ],
      pi_c: [
        BigInt(proof.pi_c[0]),
        BigInt(proof.pi_c[1])
      ]
    };
  } catch (error) {
    console.error('Error formatting proof:', error);
    throw new Error('Failed to format proof for contract');
  }
}

/**
 * Verify a ZK proof (client-side verification)
 * Real implementation using snarkjs
 */
export async function verifyZKProof(proof: ZKProof, publicSignals: string[]): Promise<boolean> {
  try {
    // Load verification key
    const vkeyPath = '/circuits/verification_key.json';
    const vkey = await fetch(vkeyPath).then(res => res.json());
    
    // Convert proof back to snarkjs format
    const snarkjsProof = {
      protocol: "groth16",
      curve: "bn128",
      pi_a: [
        proof.pi_a[0],
        proof.pi_a[1]
      ],
      pi_b: [
        [
          proof.pi_b[0][0],
          proof.pi_b[0][1]
        ],
        [
          proof.pi_b[1][0],
          proof.pi_b[1][1]
        ]
      ],
      pi_c: [
        proof.pi_c[0],
        proof.pi_c[1]
      ]
    };

    // Convert public signals to strings (snarkjs expects strings)
    const snarkjsPublicSignals = publicSignals.map(signal => signal.toString());

    // Verify the proof
    const isValid = await snarkjs.groth16.verify(vkey, snarkjsPublicSignals, snarkjsProof);
    return isValid;
  } catch (error) {
    console.error('Error verifying ZK proof:', error);
    return false;
  }
}

/**
 * Generate witness for the circuit
 * Real implementation using the actual circuit
 */
export async function generateWitness(inputs: ZKProofInputs): Promise<any> {
  try {
    // Prepare circuit input
    const circuitInput = {
      password: inputs.password,
      storedHash: inputs.storedHash
    };

    // Load the circuit WASM
    const wasmPath = '/circuits/login_auth.wasm';
    
    // Generate witness using snarkjs
    const witness = await snarkjs.wtns.calculate(
      circuitInput,
      wasmPath,
      'witness.wtns'
    );
    
    return witness;
  } catch (error) {
    console.error('Error generating witness:', error);
    throw new Error('Failed to generate witness');
  }
}

/**
 * Validate proof inputs
 */
export function validateProofInputs(inputs: ZKProofInputs): { valid: boolean; error?: string } {
  if (!inputs.password || inputs.password.length < 1) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (!inputs.storedHash || inputs.storedHash === '0') {
    return { valid: false, error: 'Stored hash is required' };
  }
  
  if (!inputs.storedHash.startsWith('0x')) {
    return { valid: false, error: 'Stored hash must be a valid hex string' };
  }
  
  return { valid: true };
}
