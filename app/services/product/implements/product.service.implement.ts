import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../../../dtos/response/product/product.response';
import { ProductRepository } from '../../../repositories/product.repository';
import { IProductService } from '../product.service.interface';
import {
  ProductRequestDto,
  UpdateProductRequestDto,
} from '../../../dtos/request/product/product.request';
import { RedisSearchService } from '../../../services/redis_search/implements/redis_search.service.implement';
import { IProductCacheService } from '../product_cache.service.interface';
import { ProductCacheService } from './product_cache.service.implement';
import { EmbeddingScheduler } from '../../../schedulers/embedding.scheduler';
import { IWarehouseService } from '../../warehouse/warehouse.service.interface';
import { WarehouseService } from '../../warehouse/implements/warehouse.service.implement';
import InventoryRepository from '../../../repositories/inventory.repository';
import redis from '../../../config/redis.config';
import { IRecommendationService } from '../../recommendation/recommendation.service.interface';
import { RecommendationService } from '../../recommendation/implements/recommendation.service.implement';

export class ProductService implements IProductService {
  private readonly productRepository: ProductRepository;
  private readonly redisSearchService: RedisSearchService;
  private readonly productCacheService: IProductCacheService;
  private readonly warehouseService: IWarehouseService;
  private readonly inventoryRepository: InventoryRepository;
  private readonly recommendationService: IRecommendationService;

  constructor() {
    this.productRepository = new ProductRepository();
    this.redisSearchService = new RedisSearchService();
    this.productCacheService = new ProductCacheService();
    this.warehouseService = new WarehouseService();
    this.inventoryRepository = new InventoryRepository();
    this.recommendationService = new RecommendationService();
  }

  async createProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    const newProduct = await this.productRepository.createProduct(product);

    try {
      const productEntity = await this.productRepository.getProductEntityById(
        newProduct.id,
      );

      await this.productCacheService.indexProduct(productEntity);

      // Generate embedding for new product (async, don't wait)
      const embeddingScheduler = new EmbeddingScheduler();
      embeddingScheduler
        .generateProductEmbedding(newProduct.id)
        .catch((error) => {
          console.error('Error generating embedding for new product:', error);
        });
      await this.createInventoriesForVariants(productEntity.variants);
    } catch (error) {
      console.error('Error indexing new product:', error);
    }

    return newProduct;
  }

  async createProductWithId(
    product: ProductRequestDto,
  ): Promise<ProductResponseDto> {
    const newProduct = await this.productRepository.createProductWithId(
      product,
    );

    try {
      const productEntity = await this.productRepository.getProductEntityById(
        newProduct.id,
      );

      await this.productCacheService.indexProduct(productEntity);
      await this.createInventoriesForVariants(productEntity.variants);
    } catch (error) {
      console.error('Error indexing new product:', error);
    }

    return newProduct;
  }

    async updateProduct(
    product: UpdateProductRequestDto,
  ): Promise<ProductResponseDto> {
    await this.productRepository.updateProduct(product);

    let updatedProduct: ProductResponseDto = {} as ProductResponseDto;
    try {
      updatedProduct = await this.productRepository.getProductById(product.id);
      await this.productCacheService.indexProduct(updatedProduct);
      const embeddingScheduler = new EmbeddingScheduler();
      embeddingScheduler.generateProductEmbedding(product.id).catch((error) => {
        console.error(
          'Error regenerating embedding for updated product:',
          error,
        );
      });
    } catch (error) {
      console.error('Error updating product index:', error);
    }
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productRepository.deleteProduct(id);

    try {
      await this.productCacheService.removeProduct(id);
    } catch (error) {
      console.error('Error removing product from index:', error);
    }
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    return this.productRepository.getProductById(id);
  }

  async getAllProducts(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productRepository.getAllProducts(page, limit);
  }

  async searchProducts(
    search?: string,
    categoryId?: string,
    slug?: string,
    sort: string = 'desc',
    sortBy: string = 'createdAt',
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    try {
      const searchResult = await this.redisSearchService.searchProducts(
        search || '',
        categoryId,
        slug,
        sortBy,
        sort,
        page,
        limit,
      );

      return {
        products: searchResult.products,
        pagination: {
          total: searchResult.total,
          totalPages: Math.ceil(searchResult.total / limit),
          hasNext: page * limit < searchResult.total,
          hasPrev: page > 1,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error(
        'Redis search failed, falling back to database search:',
        error,
      );

      if (search && !categoryId) {
        return this.productRepository.searchProducts(search, page, limit);
      } else {
        return {
          products: [],
          pagination: {
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
            page,
            limit,
          },
        };
      }
    }
  }

  async initializeSearchIndex(): Promise<void> {
    try {
      await this.productCacheService.reindexAllProducts();
    } catch (error) {
      console.error('Error initializing search index:', error);
      throw error;
    }
  }

  async getProductBySlug(slug: string): Promise<ProductResponseDto | null> {
    return this.productRepository.getProductBySlug(slug);
  }

  async getProductByName(name: string): Promise<ProductResponseDto | null> {
    return this.productRepository.getProductByName(name);
  }

  private async createInventoriesForVariants(variants: any[]): Promise<void> {
    if (!variants || variants.length === 0) return;

    const warehouses = await this.warehouseService.getAll();
    const inventoryPromises = [];

    for (const variant of variants) {
      for (const warehouse of warehouses) {
        inventoryPromises.push(
          (async () => {
            try {
              const existing =
                await this.inventoryRepository.getInventoryByVariantIdAndWarehouseId(
                  variant.id,
                  warehouse.id,
                );

              if (!existing) {
                await this.inventoryRepository.createInventory({
                  warehouse: warehouse,
                  variant: variant,
                  onHand: 0,
                  reserved: 0,
                });
              }
            } catch (error) {
              console.error(
                `Error creating inventory for variant ${variant.id} in warehouse ${warehouse.id}:`,
                error,
              );
            }
          })(),
        );
      }
    }

    await Promise.all(inventoryPromises);
  }

  /**
   * Search product by ID using Redis cache first, fallback to database if not found
   * This provides fast cache access while ensuring data consistency
   */
  async searchProductsByProductId(
    productId: string,
  ): Promise<ProductResponseDto[]> {
    try {
      const cachedProducts =
        await this.redisSearchService.searchProductsByProductId(productId);

      if (cachedProducts && cachedProducts.length > 0) {
        return cachedProducts;
      }
      const product = await this.productRepository.getProductById(productId);

      await this.productCacheService.indexProduct(product);
      return [product];
    } catch (error) {
      console.error(`Error searching product by ID ${productId}:`, error);
      try {
        const product = await this.productRepository.getProductById(productId);
        return [product];
      } catch {
        return [];
      }
    }
  }

  async updateUserPreference(
    userId: number,
    productEmbedding: number[],
    weight: number,
  ): Promise<void> {
    await this.recommendationService.updateUserPreference(
      userId,
      productEmbedding,
      weight,
    );
  }

  /**
   * Get product embedding from Redis cache
   */
  async getProductEmbedding(productId: string): Promise<number[] | null> {
    try {
      const productKey = `product:${productId}`;
      const embeddingBuffer = await redis.hgetBuffer(productKey, 'embedding');

      if (!embeddingBuffer || embeddingBuffer.length !== 768 * 4) {
        return null;
      }

      const alignedBuffer = Buffer.from(embeddingBuffer);

      const float32Array = new Float32Array(
        alignedBuffer.buffer,
        alignedBuffer.byteOffset,
        768,
      );
      return Array.from(float32Array);
    } catch (error) {
      console.error(`Error getting product embedding for ${productId}:`, error);
      return null;
    }
  }
}
