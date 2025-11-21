import { ProductResponseDto } from '../../dtos/response/product/product.response';

export interface IRecommendationService {
  /**
   * Update user preference vector based on product interaction
   * @param userId - User ID
   * @param productEmbedding - Product embedding vector (768 dimensions)
   * @param weight - Weight for this interaction (0.1 for view, 0.5 for purchase)
   */
  updateUserPreference(
    userId: number,
    productEmbedding: number[],
    weight: number,
  ): Promise<void>;

  /**
   * Get product recommendations for a user based on their preference vector
   * @param userId - User ID
   * @param limit - Maximum number of recommendations (default: 10)
   * @returns List of recommended products
   */
  getRecommendations(
    userId: number,
    limit?: number,
  ): Promise<ProductResponseDto[]>;
}

