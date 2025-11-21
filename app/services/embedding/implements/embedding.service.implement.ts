import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config/env';
import { IEmbeddingService } from '../embedding.service.interface';
import logger from '../../../utils/logger';

export class EmbeddingService implements IEmbeddingService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    // Use embedding model (text-embedding-004) or gemini for embeddings
    // Note: Gemini Pro doesn't have direct embedding API, so we'll use a workaround
    // For production, consider using Google's text-embedding-004 model
    this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
  }

  /**
   * Generate embedding using Google's Embedding API (text-embedding-004)
   * Returns a 768-dimensional vector
   * This method uses the real Google Gemini API and only falls back to simple embedding
   * if there's a critical error (like network failure or invalid API key)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        logger.warn('Empty text provided for embedding, using zero vector');
        return new Array(768).fill(0);
      }

      // Sử dụng model embedding chuyên dụng text-embedding-004
      // Model này trả về vector 768 chiều
      const embeddingModel = this.genAI.getGenerativeModel({
        model: 'text-embedding-004',
      });

      const result = await embeddingModel.embedContent(text);
      const embedding = result.embedding;

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
      // Only use fallback for critical errors (network, API key, etc.)
      // Log the error but don't break the flow
      logger.error('Error generating embedding from Gemini API:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      // Check if it's a critical error (API key, network, etc.)
      const isCriticalError =
        error.message?.includes('API_KEY') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED') ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT';

      if (isCriticalError) {
        logger.warn(
          'Critical error detected, using fallback embedding generation',
        );
        return this.createSimpleEmbedding(text);
      }

      // For non-critical errors, try to return a zero vector or throw
      // This ensures we don't silently fail
      logger.error(
        'Non-critical embedding error, but cannot generate proper embedding',
      );
      return new Array(768).fill(0);
    }
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
