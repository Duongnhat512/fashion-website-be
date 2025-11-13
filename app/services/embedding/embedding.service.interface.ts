export interface IEmbeddingService {
  /**
   * Generate embedding vector for a given text
   * @param text - Text to embed
   * @returns Promise<number[]> - Embedding vector (768 dimensions for Gemini)
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Calculate cosine similarity between two vectors
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns number - Cosine similarity score (0-1)
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number;
}
