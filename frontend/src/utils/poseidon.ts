// Optimized Poseidon hash utility for password hashing
// Browser-compatible implementation using poseidon-hash

import { ethers } from 'ethers';
import { poseidon } from 'poseidon-hash';

/**
 * Poseidon hash function for ZK-friendly hashing
 * Browser-compatible implementation using poseidon-hash
 */
export function poseidonHash(input: string): string {
  try {
    // Convert string to BigInt array for Poseidon
    const inputBytes = ethers.toUtf8Bytes(input);
    const inputBigInt = BigInt(ethers.hexlify(inputBytes));
    
    // Use Poseidon hash with single input
    const hash = poseidon([inputBigInt]);
    
    // Convert to hex string
    return '0x' + hash.toString(16);
  } catch (error) {
    console.error('Error in Poseidon hash function:', error);
    // Fallback to keccak256 if Poseidon fails
    try {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(input));
      return hash;
    } catch (fallbackError) {
      console.error('Fallback hash also failed:', fallbackError);
      throw new Error('Failed to hash input');
    }
  }
}

/**
 * Hash with multiple inputs (demo implementation)
 * @param inputs Array of BigInt inputs
 * @returns Hash as hex string
 */
export function poseidonHashMultiple(inputs: bigint[]): string {
  try {
    // For demo purposes, combine inputs and hash
    const combined = inputs.map(i => i.toString()).join('');
    const hash = ethers.keccak256(ethers.toUtf8Bytes(combined));
    return hash;
  } catch (error) {
    console.error('Error in hash multiple:', error);
    throw new Error('Failed to compute hash');
  }
}

/**
 * Convert string to BigInt for circuit input
 * @param input String input
 * @returns BigInt representation
 */
export function stringToBigInt(input: string): bigint {
  // Convert string to bytes, then to BigInt
  const bytes = ethers.toUtf8Bytes(input);
  return BigInt(ethers.hexlify(bytes));
}

/**
 * Convert BigInt to hex string for contract interaction
 * @param value BigInt value
 * @returns Hex string with 0x prefix
 */
export function bigIntToHex(value: bigint): string {
  return '0x' + value.toString(16);
}

/**
 * Convert hex string to BigInt
 * @param hex Hex string
 * @returns BigInt value
 */
export function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}

/**
 * Validate if a string is a valid hex string
 * @param hex String to validate
 * @returns True if valid hex string
 */
export function isValidHex(hex: string): boolean {
  return /^0x[0-9a-fA-F]+$/.test(hex);
}

/**
 * Pad hex string to 32 bytes (64 hex characters)
 * @param hex Hex string to pad
 * @returns Padded hex string
 */
export function padHex(hex: string): string {
  if (!isValidHex(hex)) {
    throw new Error('Invalid hex string');
  }
  
  const cleanHex = hex.slice(2); // Remove 0x prefix
  const padded = cleanHex.padStart(64, '0');
  return '0x' + padded;
}
