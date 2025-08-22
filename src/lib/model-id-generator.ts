// Model ID generation utilities for hashed model management

/**
 * Generate a random hash suffix for unique model IDs
 */
function generateRandomHash(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique hashed model ID for active models
 * @param baseModelId - The original model ID (e.g., 'gemma3:4b')
 * @returns Hashed ID (e.g., 'gemma3:4b:abc12345')
 */
export function generateHashedModelId(baseModelId: string): string {
  const hash = generateRandomHash();
  return `${baseModelId}:${hash}`;
}

/**
 * Extract base model ID from hashed ID
 * @param hashedId - Hashed model ID (e.g., 'gemma3:4b:abc12345')
 * @returns Base model ID (e.g., 'gemma3:4b')
 */
export function extractBaseModelId(hashedId: string): string {
  // Split by ':' and take all parts except the last (hash)
  const parts = hashedId.split(':');
  if (parts.length <= 2) {
    // Not a hashed ID, return as-is (for backward compatibility)
    return hashedId;
  }

  // Rejoin all parts except the last (which is the hash)
  return parts.slice(0, -1).join(':');
}

/**
 * Check if a model ID is hashed (contains a hash suffix)
 * @param modelId - Model ID to check
 * @returns True if the ID appears to be hashed
 */
export function isHashedModelId(modelId: string): boolean {
  const parts = modelId.split(':');
  if (parts.length <= 2) return false;

  const lastPart = parts[parts.length - 1];
  // Check if last part looks like a hash (8 chars, alphanumeric)
  return /^[a-z0-9]{8}$/.test(lastPart);
}
