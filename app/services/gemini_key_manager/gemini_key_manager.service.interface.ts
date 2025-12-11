export interface ApiKeyInfo {
  key: string;
  id: string; // Unique identifier for tracking
  dailyUsage: number;
  lastResetDate: string; // YYYY-MM-DD format
  isActive: boolean;
}

export interface IGeminiKeyManager {
  /**
   * Get an available API key for use
   * Returns null if all keys are exhausted
   */
  getAvailableKey(): Promise<string | null>;

  /**
   * Mark an API key as used (increment usage count)
   */
  markKeyUsed(keyId: string): Promise<void>;

  /**
   * Get current status of all API keys
   */
  getKeysStatus(): Promise<ApiKeyInfo[]>;

  /**
   * Reset daily usage counter for a key (for testing or manual reset)
   */
  resetKeyUsage(keyId: string): Promise<void>;

  /**
   * Get total available requests remaining across all keys
   */
  getTotalRemainingRequests(): Promise<number>;
}

