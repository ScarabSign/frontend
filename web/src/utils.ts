/**
 * Converts a Starknet signature array to a hex string format
 * @param signature Array containing [v, r, s] values from Starknet signature
 * @returns Formatted hex string of the signature
 */
export const formatStarknetSignature = (signature: string[]): string => {
  // Destructure the signature array - Starknet returns [v, r, s]
  const [, r, s] = signature;
  
  // Convert r and s to hex strings, removing '0x' prefix if present
  const rHex = BigInt(r).toString(16).padStart(64, '0');
  const sHex = BigInt(s).toString(16).padStart(64, '0');
  
  // Concatenate with 0x prefix
  return `0x${rHex}${sHex}`;
}

/**
 * Checks if a string is a valid hex string
 * @param str String to check
 * @returns boolean indicating if string is valid hex
 */
export const isValidHexString = (str: string): boolean => {
  return /^0x[0-9a-fA-F]+$/.test(str);
}

/**
 * Splits a hex signature back into r and s components
 * @param hexSignature Hex string signature
 * @returns Object containing r and s values
 */
export const splitSignature = (hexSignature: string): { r: string, s: string } => {
  if (!isValidHexString(hexSignature)) {
    throw new Error('Invalid hex signature format');
  }
  
  // Remove '0x' prefix
  const signatureWithoutPrefix = hexSignature.slice(2);
  
  // Split into r and s components (64 characters each)
  const r = '0x' + signatureWithoutPrefix.slice(0, 64);
  const s = '0x' + signatureWithoutPrefix.slice(64, 128);
  
  return { r, s };
}

