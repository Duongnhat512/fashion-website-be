import redis from '../../../config/redis.config';
import { IRecommendationService } from '../recommendation.service.interface';
import { ProductResponseDto } from '../../../dtos/response/product/product.response';
import { RedisSearchService } from '../../redis_search/implements/redis_search.service.implement';
import logger from '../../../utils/logger';
import { ProductRepository } from '../../../repositories/product.repository';

export class RecommendationService implements IRecommendationService {
  private readonly redisSearchService: RedisSearchService;
  private readonly productRepository: ProductRepository;
  private readonly USER_PREFERENCE_PREFIX = 'user:preference:';
  private readonly VECTOR_DIMENSION = 768;
  private readonly VECTOR_SIZE = 768 * 4; // 4 bytes per float32

  constructor() {
    this.redisSearchService = new RedisSearchService();
    this.productRepository = new ProductRepository();
  }

  /**
   * Convert Buffer to number array (vector)
   */
  private bufferToVector(buffer: Buffer): number[] {
    if (buffer.length !== this.VECTOR_SIZE) {
      throw new Error(
        `Invalid vector size: expected ${this.VECTOR_SIZE} bytes, got ${buffer.length}`,
      );
    }

    const alignedBuffer = Buffer.from(buffer);

    const float32Array = new Float32Array(
      alignedBuffer.buffer,
      alignedBuffer.byteOffset,
      this.VECTOR_DIMENSION,
    );
    return Array.from(float32Array);
  }

  /**
   * Convert number array (vector) to Buffer
   */
  private vectorToBuffer(vector: number[]): Buffer {
    if (vector.length !== this.VECTOR_DIMENSION) {
      throw new Error(
        `Invalid vector dimension: expected ${this.VECTOR_DIMENSION}, got ${vector.length}`,
      );
    }
    return Buffer.from(new Float32Array(vector).buffer);
  }

  /**
   * Update user preference vector based on product interaction
   * Uses weighted average: newVector = oldVector * (1 - weight) + productVector * weight
   */
  async updateUserPreference(
    userId: number,
    productEmbedding: number[],
    weight: number,
  ): Promise<void> {
    try {
      // Validate input
      if (productEmbedding.length !== this.VECTOR_DIMENSION) {
        logger.error(
          `Invalid product embedding dimension: expected ${this.VECTOR_DIMENSION}, got ${productEmbedding.length}`,
        );
        return;
      }

      if (weight < 0 || weight > 1) {
        logger.error(`Invalid weight: ${weight}, must be between 0 and 1`);
        return;
      }

      const userKey = `${this.USER_PREFERENCE_PREFIX}${userId}`;

      // Get existing user preference vector
      const oldVectorBytes = await redis.getBuffer(userKey);
      let newVector: number[];

      if (!oldVectorBytes || oldVectorBytes.length !== this.VECTOR_SIZE) {
        // First time - use product embedding directly
        newVector = [...productEmbedding];
        logger.debug(`Creating new preference vector for user ${userId}`);
      } else {
        // Update existing vector using weighted average
        const oldVector = this.bufferToVector(oldVectorBytes);
        newVector = oldVector.map(
          (val, i) => val * (1 - weight) + productEmbedding[i] * weight,
        );
        logger.debug(
          `Updating preference vector for user ${userId} with weight ${weight}`,
        );
      }

      // Normalize vector (for cosine similarity)
      const magnitude = Math.sqrt(
        newVector.reduce((sum, val) => sum + val * val, 0),
      );
      if (magnitude > 0) {
        newVector = newVector.map((val) => val / magnitude);
      }

      // Save to Redis (as binary buffer)
      const newVectorBuffer = this.vectorToBuffer(newVector);
      await redis.set(userKey, newVectorBuffer);

      // Set TTL to 90 days (user preference expires after inactivity)
      await redis.expire(userKey, 90 * 24 * 60 * 60);
    } catch (error) {
      logger.error(`Error updating user preference for user ${userId}:`, error);
      // Don't throw - fail silently to not break main flow
    }
  }

  /**
   * Get product recommendations for a user
   * Uses KNN (K-Nearest Neighbors) search with Redis Vector Search
   */
  async getRecommendations(
    userId: number,
    limit: number = 10,
  ): Promise<ProductResponseDto[]> {
    try {
      const userKey = `${this.USER_PREFERENCE_PREFIX}${userId}`;

      // Get user preference vector
      const userVectorBytes = await redis.getBuffer(userKey);

      if (!userVectorBytes || userVectorBytes.length !== this.VECTOR_SIZE) {
        // User has no preference - return trending/newest products
        logger.debug(
          `User ${userId} has no preference, returning newest products`,
        );
        const result = await this.redisSearchService.searchProducts(
          '',
          undefined,
          undefined,
          'createdAt',
          'desc',
          1,
          limit,
        );
        return this.convertRedisProductsToDto(result.products);
      }

      // Perform KNN search using Redis Vector Search
      // FT.SEARCH idx:products "*=>[KNN 10 @embedding $vec_param AS score]"
      // PARAMS 2 vec_param "..." SORTBY score ASC LIMIT 0 10 DIALECT 2
      try {
        const results = (await redis.call(
          'FT.SEARCH',
          'idx:products',
          `*=>[KNN ${limit} @embedding $vec_param AS score]`,
          'PARAMS',
          '2',
          'vec_param',
          userVectorBytes,
          'SORTBY',
          'score',
          'ASC', // Lower score = more similar (cosine distance)
          'LIMIT',
          '0',
          limit.toString(),
          'DIALECT',
          '2',
        )) as any[];

        // Parse results
        const products = this.parseRedisKNNResults(results);
        return this.convertRedisProductsToDto(products);
      } catch (error: any) {
        // If vector search fails (e.g., index not found, embedding not set), fallback to text search
        logger.warn(
          `Vector search failed for user ${userId}, falling back to newest products:`,
          error.message,
        );
        const result = await this.redisSearchService.searchProducts(
          '',
          undefined,
          undefined,
          'createdAt',
          'desc',
          1,
          limit,
        );
        return this.convertRedisProductsToDto(result.products);
      }
    } catch (error) {
      logger.error(`Error getting recommendations for user ${userId}:`, error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Parse Redis KNN search results
   */
  private parseRedisKNNResults(results: any[]): any[] {
    if (!results || results.length < 2) {
      return [];
    }

    const total = results[0] as number;
    const products: any[] = [];

    for (let i = 1; i < results.length; i += 2) {
      const productKey = results[i] as string;
      const productData = results[i + 1] as any[];

      if (!productKey || !productData) {
        continue;
      }

      const product: any = {};

      for (let j = 0; j < productData.length; j += 2) {
        const key = productData[j];
        const value = productData[j + 1];

        if (key === 'createdAt' || key === 'updatedAt') {
          product[key] = new Date(parseInt(value));
        } else if (key === 'ratingAverage') {
          product[key] = parseFloat(value);
        } else if (key === 'ratingCount') {
          product[key] = parseInt(value);
        } else if (key === 'variants') {
          try {
            product[key] = JSON.parse(value);
          } catch (error) {
            product[key] = [];
          }
        } else if (key === 'score') {
          // KNN score (cosine distance - lower is better)
          product._score = parseFloat(value);
        } else if (key !== 'embedding') {
          // Skip embedding field in response
          product[key] = value;
        }
      }

      // Remove embedding from response
      delete product.embedding;
      products.push(product);
    }

    return products;
  }

  /**
   * Convert Redis product format to ProductResponseDto
   * Fetches full product details from database
   */
  private async convertRedisProductsToDto(
    redisProducts: any[],
  ): Promise<ProductResponseDto[]> {
    const products: ProductResponseDto[] = [];

    for (const redisProduct of redisProducts) {
      try {
        // Fetch full product from database to get all relations
        const product = await this.productRepository.getProductById(
          redisProduct.id,
        );
        products.push(product);
      } catch (error) {
        logger.warn(
          `Failed to fetch product ${redisProduct.id} from database:`,
          error,
        );
        // Skip products that can't be fetched - continue to next iteration
      }
    }

    return products;
  }
}
