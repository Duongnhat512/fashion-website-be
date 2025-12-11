import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config/env';
import { IEmbeddingService } from '../embedding.service.interface';
import logger from '../../../utils/logger';
import { GeminiKeyManager } from '../../gemini_key_manager/implements/gemini_key_manager.service.implement';

export class EmbeddingService implements IEmbeddingService {
  private keyManager: GeminiKeyManager;

  constructor() {
    // Initialize key manager with all available keys
    this.keyManager = new GeminiKeyManager(config.gemini.apiKeys);
  }

  /**
   * Generate embedding using Google's Embedding API (text-embedding-004)
   * Returns a 768-dimensional vector
   * This method uses the real Google Gemini API and only falls back to simple embedding
   * if there's a critical error (like network failure or invalid API key)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const maxRetries = 3; // Try up to 3 different keys
    let lastError: Error | null = null;

    // Validate input
    if (!text || text.trim().length === 0) {
      logger.warn('Empty text provided for embedding, using zero vector');
      return new Array(768).fill(0);
    }

    // Try with different API keys if one fails
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let genAI: GoogleGenerativeAI | null = null;
      let apiKey: string | null = null;

      try {
        // Get available API key
        apiKey = await this.keyManager.getAvailableKey();
        if (!apiKey) {
          throw new Error(
            'No available Gemini API keys. All keys have reached daily limit.',
          );
        }

        genAI = new GoogleGenerativeAI(apiKey);

        // Sử dụng model embedding chuyên dụng text-embedding-004
        // Model này trả về vector 768 chiều
        const embeddingModel = genAI.getGenerativeModel({
          model: 'text-embedding-004',
        });

        const result = await embeddingModel.embedContent(text);
        const embedding = result.embedding;

        // Mark key as used if successful
        if (apiKey) {
          await this.keyManager.markKeyUsedByKey(apiKey).catch((err) => {
            logger.warn('Failed to mark key as used:', err);
          });
        }

        // Đảm bảo vector có đúng 768 chiều
        if (embedding.values && embedding.values.length > 0) {
          const vector = embedding.values;

          // Nếu vector không đủ 768 chiều, pad với 0
          if (vector.length < 768) {
            logger.warn(
              `Embedding vector has ${vector.length} dimensions, padding to 768`,
            );
            return [...vector, ...new Array(768 - vector.length).fill(0)];
          }

          // Nếu vector quá dài, cắt bớt
          if (vector.length > 768) {
            logger.warn(
              `Embedding vector has ${vector.length} dimensions, truncating to 768`,
            );
            return vector.slice(0, 768);
          }

          // Normalize vector for cosine similarity
          const magnitude = Math.sqrt(
            vector.reduce((sum, val) => sum + val * val, 0),
          );
          if (magnitude > 0) {
            return vector.map((val) => val / magnitude);
          }

          return vector;
        }

        throw new Error('Empty embedding returned from API');
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error (429) or quota exceeded
        const isRateLimitError =
          error.code === 429 ||
          error.message?.includes('429') ||
          error.message?.includes('quota') ||
          error.message?.includes('rate limit') ||
          error.message?.includes('RESOURCE_EXHAUSTED');

        // Check if it's an API key error
        const isApiKeyError =
          error.message?.includes('API_KEY') ||
          error.message?.includes('API key') ||
          error.code === 401 ||
          error.code === 403;

        if (isRateLimitError || isApiKeyError) {
          // Mark key as used (even though it failed, it counted towards quota)
          if (apiKey) {
            await this.keyManager.markKeyUsedByKey(apiKey).catch((err) => {
              logger.warn('Failed to mark key as used:', err);
            });
          }

          // Try next key if available
          if (attempt < maxRetries - 1) {
            logger.warn(
              `API key failed (rate limit/error), trying next key... (attempt ${
                attempt + 1
              }/${maxRetries})`,
            );
            continue; // Try next key
          }
        }

        // For other errors, log and continue to fallback
        logger.error(`Error generating embedding (attempt ${attempt + 1}):`, {
          message: error.message,
          code: error.code,
        });

        // If not rate limit error, don't retry with other keys
        if (!isRateLimitError && !isApiKeyError) {
          break;
        }
      }
    }

    // All retries failed - use fallback
    logger.warn(
      'All API keys failed or exhausted, using fallback embedding generation',
    );
    return this.createSimpleEmbedding(text);
  }

  /**
   * Create a simple embedding vector from text (fallback method)
   * Returns a 768-dimensional normalized vector
   * For production, use Google's embedding API
   */
  private createSimpleEmbedding(text: string): number[] {
    // Create a 768-dimensional vector based on text features
    const words = text.toLowerCase().split(/\s+/);
    const vector = new Array(768).fill(0);

    // Simple hash-based embedding
    words.forEach((word, idx) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      const index = Math.abs(hash) % 768;
      vector[index] += 1 / (idx + 1); // Weight by position
    });

    // Normalize vector to unit length (for cosine similarity)
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0),
    );
    if (magnitude > 0) {
      return vector.map((val) => val / magnitude);
    }

    // If empty vector, return a small random vector
    return vector.map(() => Math.random() * 0.001);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }
}
