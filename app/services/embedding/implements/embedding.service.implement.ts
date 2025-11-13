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
   * Generate embedding using Google's Embedding API
   *
   * Note: To use Google's text-embedding-004 model, you need to:
   * 1. Enable the Generative Language API in Google Cloud Console
   * 2. Use the REST API endpoint: https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent
   *
   * For now, we use a hash-based fallback. To upgrade:
   * - Install: npm install axios
   * - Replace this method with a call to Google's Embedding API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // TODO: Replace with Google Embedding API call
      // Example:
      // const response = await axios.post(
      //   `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${config.gemini.apiKey}`,
      //   { content: { parts: [{ text }] } }
      // );
      // return response.data.embedding.values;

      // Current implementation: hash-based embedding (fallback)
      const embedding = this.createSimpleEmbedding(text);

      return embedding;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      // Fallback to simple embedding
      return this.createSimpleEmbedding(text);
    }
  }

  /**
   * Create a simple embedding vector from text
   * This is a fallback method. For production, use Google's embedding API
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

    // Normalize vector
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0),
    );
    if (magnitude > 0) {
      return vector.map((val) => val / magnitude);
    }
    return vector;
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
