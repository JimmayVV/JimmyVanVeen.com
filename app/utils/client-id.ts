// Shared utility for generating unique client IDs

/**
 * Generates a unique client ID with enhanced entropy
 * Format: timestamp.entropy.random
 *
 * @returns A unique client ID string
 */
export function generateClientId(): string {
  const timestamp = Date.now();

  // Add entropy from performance timing if available
  const entropy =
    typeof performance !== "undefined" && performance.now
      ? Math.floor(performance.now() * 1000)
      : Math.floor(Math.random() * 1000000);

  // Generate random component
  const random = Math.random().toString(36).substring(2);

  return `${timestamp}.${entropy}.${random}`;
}

/**
 * Validates if a string looks like a valid client ID
 *
 * @param clientId - The client ID to validate
 * @returns True if the client ID appears valid
 */
export function isValidClientId(clientId: string): boolean {
  // Basic format validation: timestamp.entropy.random
  const parts = clientId.split(".");
  if (parts.length < 2) return false;

  // Check if first part looks like a timestamp
  const timestamp = parseInt(parts[0]);
  if (isNaN(timestamp) || timestamp < 1000000000000) return false; // After 2001

  return true;
}
