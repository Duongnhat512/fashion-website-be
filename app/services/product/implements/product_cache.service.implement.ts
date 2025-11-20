import redis from '../../../config/redis.config';
import { ProductResponseDto } from '../../../dtos/response/product/product.response';
import { ProductRepository } from '../../../repositories/product.repository';
import { IProductCacheService } from '../product_cache.service.interface';
import { normalizeText } from '../../../utils/product.util';
import { VariantService } from './variant.service.implement';

export class ProductCacheService implements IProductCacheService {
  private readonly variantService = new VariantService();
  private readonly indexName = 'idx:products';
  private readonly PRODUCT_PREFIX = 'product:';
  private readonly productRepository = new ProductRepository();

  async createIndex(): Promise<void> {
    try {
      const exists = await redis.call('FT.INFO', this.indexName);
      if (exists) {
        return;
      }
    } catch (error) {}

    try {
      await redis.call(
        'FT.CREATE',
        this.indexName,
        'ON',
        'HASH',
        'PREFIX',
        '1',
        'product:',
        'SCHEMA',
        'id',
        'TEXT',
        'NOSTEM',

        'name',
        'TEXT',
        'SORTABLE',

        'brand',
        'TEXT',
        'SORTABLE',

        'shortDescription',
        'TEXT',

        'tags',
        'TEXT',

        'status',
        'TAG',
        'SORTABLE',

        'slug',
        'TEXT',
        'NOSTEM',
        'SORTABLE',

        'imageUrl',
        'TEXT',
        'NOSTEM',

        'categoryId',
        'TAG',
        'SORTABLE',

        'ratingAverage',
        'NUMERIC',
        'SORTABLE',

        'ratingCount',
        'NUMERIC',
        'SORTABLE',

        'createdAt',
        'NUMERIC',
        'SORTABLE',

        'updatedAt',
        'NUMERIC',
        'SORTABLE',

        'minPrice',
        'NUMERIC',
        'SORTABLE',

        'maxPrice',
        'NUMERIC',
        'SORTABLE',

        'variants',
        'TEXT',

        'nameNormalized',
        'TEXT',
        'NOSTEM',
        'SORTABLE',

        'shortDescriptionNormalized',
        'TEXT',
        'NOSTEM',

        'brandNormalized',
        'TEXT',
        'NOSTEM',
        'SORTABLE',

        'tagsNormalized',
        'TEXT',
        'NOSTEM',
        'SORTABLE',

        'searchContent',
        'TEXT',
        'NOSTEM',
      );
    } catch (error) {
      console.error('Error creating product search index:', error);
      throw error;
    }
  }

  /**
   * Tính giá tối thiểu từ variants
   */
  private getMinPrice(variants: any[]): number {
    if (!variants || variants.length === 0) return 0;
    const prices = variants
      .map((v) => (v.onSales ? v.discountPrice : v.price))
      .filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  /**
   * Tính giá tối đa từ variants
   */
  private getMaxPrice(variants: any[]): number {
    if (!variants || variants.length === 0) return 0;
    const prices = variants
      .map((v) => (v.onSales ? v.discountPrice : v.price))
      .filter((p) => p > 0);
    return prices.length > 0 ? Math.max(...prices) : 0;
  }

  private extractVariantSearchText(variants: any[]): string {
    if (!variants || variants.length === 0) return '';

    const searchTerms: string[] = [];

    for (const variant of variants) {
      if (variant.color) {
        if (typeof variant.color === 'object' && variant.color.name) {
          searchTerms.push(normalizeText(variant.color.name));
        } else if (typeof variant.color === 'string') {
          searchTerms.push(normalizeText(variant.color));
        }
      }

      if (variant.size) {
        searchTerms.push(normalizeText(variant.size));
      }

      if (variant.sku) {
        searchTerms.push(normalizeText(variant.sku));
      }
    }

    return [...new Set(searchTerms)].join(' ');
  }

  /**
   * Lưu product vào Redis cache
   */
  async indexProduct(product: ProductResponseDto): Promise<void> {
    try {
      const variants = await Promise.all(
        product.variants.map(async (variant) => {
          return {
            ...variant,
            stock: await this.variantService.getVariantStock(variant.id),
          };
        }),
      );

      const productData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        imageUrl: product.imageUrl,
        brand: product.brand || '',
        tags: product.tags || '',
        categoryId: product.categoryId || '',
        categoryName: product.categoryName || '',
        status: product.status || 'active',
        ratingAverage: product.ratingAverage,
        ratingCount: product.ratingCount,
        createdAt: product.createdAt.getTime(),
        updatedAt: product.updatedAt.getTime(),
        minPrice: this.getMinPrice(variants || []),
        maxPrice: this.getMaxPrice(variants || []),
        variants: JSON.stringify(variants || []),
        nameNormalized: normalizeText(product.name),
        shortDescriptionNormalized: normalizeText(product.shortDescription),
        brandNormalized: normalizeText(product.brand || ''),
        tagsNormalized: normalizeText(product.tags || ''),
        searchContent: [
          product.name,
          product.shortDescription,
          product.brand,
          product.categoryName || '',
          this.extractVariantSearchText(product.variants),
        ]
          .filter(Boolean)
          .map(normalizeText)
          .join(' '),
      };

      await redis.hset(`${this.PRODUCT_PREFIX}${product.id}`, productData);
    } catch (error) {
      console.error('Error indexing product:', error);
      throw error;
    }
  }

  /**
   * Xóa product khỏi Redis cache
   */
  async removeProduct(productId: string): Promise<void> {
    const key = `${this.PRODUCT_PREFIX}${productId}`;
    try {
      const delCount = await redis.del(key);
      if (delCount === 0) {
        console.error(`Redis hash not found: ${key}`);
      }

      try {
        await redis.call('FT.DEL', this.indexName, key);
      } catch (e: any) {
        console.error('Error removing product from index:', e);
      }
    } catch (error) {
      console.error('Error removing product from Redis:', error);
      throw error;
    }
  }

  /**
   * Lấy product từ cache
   */
  async getProduct(productId: string): Promise<any | null> {
    try {
      const productData = await redis.hgetall(
        `${this.PRODUCT_PREFIX}${productId}`,
      );
      if (!productData || Object.keys(productData).length === 0) {
        return null;
      }

      // Parse product data
      const product: any = {};
      for (const [key, value] of Object.entries(productData)) {
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
        } else {
          product[key] = value;
        }
      }

      return product;
    } catch (error) {
      console.error('Error getting product from cache:', error);
      return null;
    }
  }

  /**
   * Lấy nhiều products từ cache
   */
  async getProducts(productIds: string[]): Promise<any[]> {
    try {
      const products = [];
      for (const id of productIds) {
        const product = await this.getProduct(id);
        if (product) {
          products.push(product);
        }
      }
      return products;
    } catch (error) {
      console.error('Error getting products from cache:', error);
      return [];
    }
  }

  /**
   * Kiểm tra product có tồn tại trong cache không
   */
  async existsProduct(productId: string): Promise<boolean> {
    try {
      const exists = await redis.exists(`${this.PRODUCT_PREFIX}${productId}`);
      return exists === 1;
    } catch (error) {
      console.error('Error checking product existence:', error);
      return false;
    }
  }

  /**
   * Cập nhật một field cụ thể của product trong cache
   */
  async updateProductField(
    productId: string,
    field: string,
    value: any,
  ): Promise<void> {
    try {
      await redis.hset(`${this.PRODUCT_PREFIX}${productId}`, field, value);
    } catch (error) {
      console.error('Error updating product field:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả product keys từ cache
   */
  async getAllProductKeys(): Promise<string[]> {
    try {
      const keys = await redis.keys(`${this.PRODUCT_PREFIX}*`);
      return keys;
    } catch (error) {
      console.error('Error getting all product keys:', error);
      return [];
    }
  }

  /**
   * Xóa tất cả products khỏi cache
   */
  async clearAllProducts(): Promise<void> {
    try {
      const keys = await this.getAllProductKeys();
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing all products:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê cache
   */
  async getCacheStats(): Promise<{
    totalProducts: number;
    memoryUsage: string;
  }> {
    try {
      const keys = await this.getAllProductKeys();
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'Unknown';

      return {
        totalProducts: keys.length,
        memoryUsage,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalProducts: 0,
        memoryUsage: 'Unknown',
      };
    }
  }

  async reindexAllProducts(): Promise<void> {
    try {
      await this.resetIndex();
      const products = await this.productRepository.getAll();
      for (const product of products) {
        await this.indexProduct(product);
      }
    } catch (error) {
      throw error;
    }
  }

  async resetIndex(): Promise<void> {
    try {
      await redis.call('FT.DROPINDEX', this.indexName);
    } catch (error) {}
    await this.createIndex();
  }

  async updateProductRating(
    productId: string,
    ratingAverage: number,
    ratingCount: number,
  ): Promise<void> {
    try {
      const key = `${this.PRODUCT_PREFIX}${productId}`;

      await redis.hset(key, {
        ratingAverage: ratingAverage.toString(),
        ratingCount: ratingCount.toString(),
        updatedAt: Date.now().toString(),
      });
    } catch (error) {
      console.error('Error updating product rating in Redis:', error);
      throw error;
    }
  }
}
