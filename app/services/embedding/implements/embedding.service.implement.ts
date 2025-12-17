import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config/env';
import { IEmbeddingService } from '../embedding.service.interface';
import logger from '../../../utils/logger';

export class EmbeddingService implements IEmbeddingService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    // Initialize Gemini AI client with API key
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }

  /**
   * Generate embedding using Google's Embedding API (text-embedding-004)
   * Returns a 768-dimensional vector
   * This method uses the real Google Gemini API and only falls back to simple embedding
   * if there's a critical error (like network failure or invalid API key)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Validate input
    if (!text || text.trim().length === 0) {
      logger.warn('Empty text provided for embedding, using zero vector');
      return new Array(768).fill(0);
    }

    try {
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
      // Log error and fallback to simple embedding
      logger.error('Error generating embedding:', {
        message: error.message,
        code: error.code,
      });

      logger.warn('Using fallback embedding generation');
      return this.createSimpleEmbedding(text);
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
