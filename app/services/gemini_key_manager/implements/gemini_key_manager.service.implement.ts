import redis from '../../../config/redis.config';
import logger from '../../../utils/logger';
import {
  ApiKeyInfo,
  IGeminiKeyManager,
} from '../gemini_key_manager.service.interface';

const DAILY_LIMIT = 20; // Gemini free tier limit
const USAGE_KEY_PREFIX = 'gemini:key:usage:';
const KEY_INFO_PREFIX = 'gemini:key:info:';
const ALL_KEYS_SET = 'gemini:keys:all';
const TTL_SECONDS = 86400; // 24 hours

export class GeminiKeyManager implements IGeminiKeyManager {
  private keys: ApiKeyInfo[];

  constructor(apiKeys: string[]) {
    // Initialize keys from environment
    this.keys = apiKeys
      .filter((key) => key && key.trim().length > 0)
      .map((key, index) => ({
        key: key.trim(),
        id: `key_${index + 1}`,
        dailyUsage: 0,
        lastResetDate: this.getTodayDateString(),
        isActive: true,
      }));

    if (this.keys.length === 0) {
      logger.warn('No Gemini API keys provided!');
    } else {
      logger.info(
        `Initialized Gemini Key Manager with ${this.keys.length} keys`,
      );
      // Initialize Redis keys
      this.initializeKeys().catch((error) => {
        logger.error('Error initializing keys in Redis:', error);
      });
    }
  }

  /**
   * Initialize keys in Redis
   */
  private async initializeKeys(): Promise<void> {
    try {
      // Store all key IDs in a set
      const keyIds = this.keys.map((k) => k.id);
      if (keyIds.length > 0) {
        await redis.sadd(ALL_KEYS_SET, ...keyIds);
      }

      // Initialize usage counters for each key
      for (const keyInfo of this.keys) {
        const usageKey = `${USAGE_KEY_PREFIX}${keyInfo.id}`;
        const infoKey = `${KEY_INFO_PREFIX}${keyInfo.id}`;

        // Check if usage counter exists
        const existingUsage = await redis.get(usageKey);
        const existingInfo = await redis.get(infoKey);

        // Reset if date changed
        if (existingInfo) {
          const info: ApiKeyInfo = JSON.parse(existingInfo);
          if (info.lastResetDate !== this.getTodayDateString()) {
            // New day - reset usage
            await redis.set(usageKey, '0', 'EX', TTL_SECONDS);
            const updatedInfo: ApiKeyInfo = {
              ...info,
              dailyUsage: 0,
              lastResetDate: this.getTodayDateString(),
            };
            await redis.setex(
              infoKey,
              TTL_SECONDS,
              JSON.stringify(updatedInfo),
            );
          }
        } else {
          // First time - initialize
          await redis.set(usageKey, '0', 'EX', TTL_SECONDS);
          const info: ApiKeyInfo = {
            ...keyInfo,
            dailyUsage: 0,
            lastResetDate: this.getTodayDateString(),
          };
          await redis.setex(infoKey, TTL_SECONDS, JSON.stringify(info));
        }
      }
    } catch (error) {
      logger.error('Error initializing keys:', error);
      throw error;
    }
  }

  /**
   * Get today's date string in YYYY-MM-DD format
   */
  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get current usage for a key from Redis
   */
  private async getKeyUsage(keyId: string): Promise<number> {
    try {
      const usageKey = `${USAGE_KEY_PREFIX}${keyId}`;
      const usageStr = await redis.get(usageKey);
      return usageStr ? parseInt(usageStr, 10) : 0;
    } catch (error) {
      logger.error(`Error getting usage for key ${keyId}:`, error);
      return 0;
    }
  }

  /**
   * Get an available API key using round-robin with usage awareness
   * Strategy: Try to find a key with the least usage
   */
  async getAvailableKey(): Promise<string | null> {
    if (this.keys.length === 0) {
      logger.error('No API keys available');
      return null;
    }

    try {
      // Refresh usage counts from Redis
      const keysWithUsage = await Promise.all(
        this.keys.map(async (keyInfo) => {
          const usage = await this.getKeyUsage(keyInfo.id);
          const infoKey = `${KEY_INFO_PREFIX}${keyInfo.id}`;
          const infoStr = await redis.get(infoKey);
          let info: ApiKeyInfo = keyInfo;

          if (infoStr) {
            info = JSON.parse(infoStr);
            // Check if date changed
            if (info.lastResetDate !== this.getTodayDateString()) {
              // Reset usage for new day
              await this.resetKeyUsage(keyInfo.id);
              const usage = 0;
            }
          }

          return {
            ...keyInfo,
            dailyUsage: usage,
            isActive: usage < DAILY_LIMIT,
          };
        }),
      );

      // Filter active keys (under limit)
      const availableKeys = keysWithUsage.filter(
        (k) => k.isActive && k.dailyUsage < DAILY_LIMIT,
      );

      if (availableKeys.length === 0) {
        logger.warn('All API keys have reached daily limit');
        return null;
      }

      // Sort by usage (least used first) - round-robin strategy
      availableKeys.sort((a, b) => a.dailyUsage - b.dailyUsage);

      // Get the key with least usage
      const selectedKey = availableKeys[0];
      logger.debug(
        `Selected API key ${selectedKey.id} with usage ${selectedKey.dailyUsage}/${DAILY_LIMIT}`,
      );

      return selectedKey.key;
    } catch (error) {
      logger.error('Error getting available API key:', error);
      // Fallback to first key
      return this.keys[0]?.key || null;
    }
  }

  /**
   * Mark an API key as used
   */
  async markKeyUsed(keyId: string): Promise<void> {
    try {
      const usageKey = `${USAGE_KEY_PREFIX}${keyId}`;
      const infoKey = `${KEY_INFO_PREFIX}${keyId}`;

      // Increment usage counter
      const newUsage = await redis.incr(usageKey);
      await redis.expire(usageKey, TTL_SECONDS); // Refresh TTL

      // Update key info
      const infoStr = await redis.get(infoKey);
      let info: ApiKeyInfo;

      if (infoStr) {
        info = JSON.parse(infoStr);
        // Check if date changed
        if (info.lastResetDate !== this.getTodayDateString()) {
          // New day - reset
          await redis.set(usageKey, '1', 'EX', TTL_SECONDS);
          info.dailyUsage = 1;
          info.lastResetDate = this.getTodayDateString();
        } else {
          info.dailyUsage = newUsage;
        }
      } else {
        // Initialize if not exists
        const keyInfo = this.keys.find((k) => k.id === keyId);
        info = {
          ...(keyInfo || {
            key: '',
            id: keyId,
            dailyUsage: 0,
            lastResetDate: this.getTodayDateString(),
            isActive: true,
          }),
          dailyUsage: newUsage,
          lastResetDate: this.getTodayDateString(),
        };
      }

      await redis.setex(infoKey, TTL_SECONDS, JSON.stringify(info));

      logger.debug(
        `Marked key ${keyId} as used. New usage: ${newUsage}/${DAILY_LIMIT}`,
      );

      // Warn if approaching limit
      if (newUsage >= DAILY_LIMIT * 0.8) {
        logger.warn(
          `API key ${keyId} is at ${newUsage}/${DAILY_LIMIT} usage (80% threshold)`,
        );
      }
    } catch (error) {
      logger.error(`Error marking key ${keyId} as used:`, error);
      // Don't throw - allow operation to continue
    }
  }

  /**
   * Find key ID from API key string
   */
  private findKeyIdByKey(apiKey: string): string | null {
    const keyInfo = this.keys.find((k) => k.key === apiKey);
    return keyInfo?.id || null;
  }

  /**
   * Mark API key as used by key string (convenience method)
   */
  async markKeyUsedByKey(apiKey: string): Promise<void> {
    const keyId = this.findKeyIdByKey(apiKey);
    if (keyId) {
      await this.markKeyUsed(keyId);
    } else {
      logger.warn(`Could not find key ID for API key (possibly not in config)`);
    }
  }

  /**
   * Get current status of all API keys
   */
  async getKeysStatus(): Promise<ApiKeyInfo[]> {
    try {
      const statuses = await Promise.all(
        this.keys.map(async (keyInfo) => {
          const usage = await this.getKeyUsage(keyInfo.id);
          const infoKey = `${KEY_INFO_PREFIX}${keyInfo.id}`;
          const infoStr = await redis.get(infoKey);

          let info: ApiKeyInfo = keyInfo;

          if (infoStr) {
            info = JSON.parse(infoStr);
            // Check if date changed
            if (info.lastResetDate !== this.getTodayDateString()) {
              await this.resetKeyUsage(keyInfo.id);
              info.dailyUsage = 0;
              info.lastResetDate = this.getTodayDateString();
            } else {
              info.dailyUsage = usage;
            }
          }

          return {
            ...info,
            isActive: usage < DAILY_LIMIT,
          };
        }),
      );

      return statuses;
    } catch (error) {
      logger.error('Error getting keys status:', error);
      return this.keys.map((k) => ({
        ...k,
        dailyUsage: 0,
        isActive: true,
      }));
    }
  }

  /**
   * Reset daily usage counter for a key
   */
  async resetKeyUsage(keyId: string): Promise<void> {
    try {
      const usageKey = `${USAGE_KEY_PREFIX}${keyId}`;
      const infoKey = `${KEY_INFO_PREFIX}${keyId}`;

      await redis.set(usageKey, '0', 'EX', TTL_SECONDS);

      const infoStr = await redis.get(infoKey);
      const keyInfo = this.keys.find((k) => k.id === keyId);

      const info: ApiKeyInfo = infoStr
        ? JSON.parse(infoStr)
        : {
            key: keyInfo?.key || '',
            id: keyId,
            dailyUsage: 0,
            lastResetDate: this.getTodayDateString(),
            isActive: true,
          };

      info.dailyUsage = 0;
      info.lastResetDate = this.getTodayDateString();

      await redis.setex(infoKey, TTL_SECONDS, JSON.stringify(info));

      logger.info(`Reset usage for key ${keyId}`);
    } catch (error) {
      logger.error(`Error resetting usage for key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Get total available requests remaining across all keys
   */
  async getTotalRemainingRequests(): Promise<number> {
    try {
      const statuses = await this.getKeysStatus();
      return statuses.reduce((total, status) => {
        const remaining = Math.max(0, DAILY_LIMIT - status.dailyUsage);
        return total + remaining;
      }, 0);
    } catch (error) {
      logger.error('Error calculating total remaining requests:', error);
      return 0;
    }
  }
}
