import { ProductRepository } from '../repositories/product.repository';
import { EmbeddingService } from '../services/embedding/implements/embedding.service.implement';
import redis from '../config/redis.config';
import logger from '../utils/logger';

/**
 * Scheduler to automatically generate embeddings for products
 * This should be run:
 * 1. When a new product is created
 * 2. When a product is updated
 * 3. Periodically to ensure all products have embeddings
 */
export class EmbeddingScheduler {
  private productRepository: ProductRepository;
  private embeddingService: EmbeddingService;

  constructor() {
    this.productRepository = new ProductRepository();
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Generate embedding for a single product
   */
  async generateProductEmbedding(productId: string): Promise<void> {
    try {
      const product = await this.productRepository.getProductById(productId);

      // Create text representation of product for embedding
      const productText = this.createProductText(product);

      // Generate embedding
      const embedding = await this.embeddingService.generateEmbedding(
        productText,
      );

      // Store embedding in Redis as binary (Float32Array) for vector search
      // Redis Vector Search requires binary format (Blob) for FLOAT32 vectors
      const embeddingKey = `product:${product.id}`;
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
      
      // Store as binary blob for vector search (FT.SEARCH KNN query)
      // Also keep JSON string for backward compatibility if needed
      await redis.hset(embeddingKey, {
        embedding: embeddingBuffer,
        embedding_json: JSON.stringify(embedding), // For debugging/compatibility
      });

      logger.info(`Generated embedding for product: ${productId}`);
    } catch (error) {
      logger.error(
        `Error generating embedding for product ${productId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate embeddings for all products that don't have one
   */
  async generateAllProductEmbeddings(): Promise<void> {
    try {
      logger.info('Starting to generate embeddings for all products...');

      const products = await this.productRepository.getAll();

      let successCount = 0;
      let errorCount = 0;

      for (const product of products) {
        try {
          // Check if product already has embedding in Redis (binary format)
          const embeddingKey = `product:${product.id}`;
          const existingEmbedding = await redis.hgetBuffer(
            embeddingKey,
            'embedding',
          );

          // Check if embedding exists and has correct size (768 * 4 bytes = 3072 bytes)
          if (existingEmbedding && existingEmbedding.length === 768 * 4) {
            logger.debug(
              `Product ${product.id} already has embedding, skipping`,
            );
            continue;
          }

          await this.generateProductEmbedding(product.id);
          successCount++;

          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          logger.error(`Error processing product ${product.id}:`, error);
          errorCount++;
        }
      }

      logger.info(
        `Embedding generation completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      logger.error('Error in generateAllProductEmbeddings:', error);
      throw error;
    }
  }

  /**
   * Create a comprehensive text representation of a product for embedding
   */
  private createProductText(product: any): string {
    const parts: string[] = [];

    // Product name
    if (product.name) {
      parts.push(`Tên sản phẩm: ${product.name}`);
    }

    // Description
    if (product.shortDescription) {
      parts.push(`Mô tả: ${product.shortDescription}`);
    }

    // Brand
    if (product.brand) {
      parts.push(`Thương hiệu: ${product.brand}`);
    }

    // Category
    if (product.category) {
      parts.push(`Danh mục: ${product.category.name || product.categoryId}`);
    }

    // Variants (colors, sizes, prices)
    if (product.variants && product.variants.length > 0) {
      const variantInfo = product.variants.map((v: any) => {
        const info = [];
        if (v.color) info.push(`màu ${v.color.name || v.color}`);
        if (v.size) info.push(`size ${v.size}`);
        if (v.price) info.push(`giá ${v.price}đ`);
        return info.join(', ');
      });
      parts.push(`Biến thể: ${variantInfo.join('; ')}`);
    }

    // Tags
    if (product.tags) {
      try {
        const tags = JSON.parse(product.tags);
        if (Array.isArray(tags) && tags.length > 0) {
          parts.push(`Tags: ${tags.join(', ')}`);
        }
      } catch {
        // If tags is not JSON, use as string
        if (product.tags) {
          parts.push(`Tags: ${product.tags}`);
        }
      }
    }

    // Rating
    if (product.ratingAverage) {
      parts.push(
        `Đánh giá: ${product.ratingAverage}/5 (${product.ratingCount} đánh giá)`,
      );
    }

    return parts.join('. ');
  }
}

/**
 * Initialize embedding scheduler
 * This can be called on app startup or as a cron job
 */
export async function initializeEmbeddingScheduler(): Promise<void> {
  try {
    const scheduler = new EmbeddingScheduler();

    // Generate embeddings for products that don't have one
    // This runs in the background, so we don't await it
    scheduler.generateAllProductEmbeddings().catch((error) => {
      logger.error('Error in embedding scheduler:', error);
    });

    logger.info('Embedding scheduler initialized');
  } catch (error) {
    logger.error('Failed to initialize embedding scheduler:', error);
  }
}
