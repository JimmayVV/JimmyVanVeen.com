// Client-side storage utilities with fallback handling

export interface StorageOptions {
  fallbackToSession?: boolean;
  fallbackValue?: string | null;
}

/**
 * Safely gets a value from storage with fallback chain:
 * localStorage → sessionStorage → fallbackValue
 */
export function getStorageItem(
  key: string,
  options: StorageOptions = {},
): string | null {
  const { fallbackToSession = true, fallbackValue = null } = options;

  // Try localStorage first
  try {
    const value = localStorage.getItem(key);
    if (value !== null) return value;
  } catch (error) {
    console.warn("localStorage not available:", error);
  }

  // Fallback to sessionStorage if enabled
  if (fallbackToSession) {
    try {
      const value = sessionStorage.getItem(key);
      if (value !== null) return value;
    } catch (error) {
      console.warn("sessionStorage not available:", error);
    }
  }

  return fallbackValue;
}

/**
 * Safely sets a value in storage with fallback chain:
 * localStorage → sessionStorage → silent failure
 */
export function setStorageItem(
  key: string,
  value: string,
  options: StorageOptions = {},
): boolean {
  const { fallbackToSession = true } = options;

  // Try localStorage first
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("localStorage setItem failed:", error);
  }

  // Fallback to sessionStorage if enabled
  if (fallbackToSession) {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("sessionStorage setItem failed:", error);
    }
  }

  return false;
}

/**
 * Safely removes a value from storage with fallback chain:
 * localStorage → sessionStorage → silent failure
 */
export function removeStorageItem(
  key: string,
  options: StorageOptions = {},
): boolean {
  const { fallbackToSession = true } = options;
  let success = false;

  // Try localStorage first
  try {
    localStorage.removeItem(key);
    success = true;
  } catch (error) {
    console.warn("localStorage removeItem failed:", error);
  }

  // Also try sessionStorage if enabled
  if (fallbackToSession) {
    try {
      sessionStorage.removeItem(key);
      success = true;
    } catch (error) {
      console.warn("sessionStorage removeItem failed:", error);
    }
  }

  return success;
}
