import redis from '../../../config/redis.config';
import {
  escapedCategoryId,
  normalizeText,
  removeSearchFields,
} from '../../../utils/product.util';
import { ICategoryCacheService } from '../../../services/category/category_cache.service.interface';
import { CategoryCacheService } from '../../../services/category/implements/category_cache.service.implement';
import { IRedisSearchService } from '../redis_search.service.interface';
import { ProductResponseDto } from '../../../dtos/response/product/product.response';

export class RedisSearchService implements IRedisSearchService {
  private readonly indexName = 'idx:products';
  private readonly categoryCacheService: ICategoryCacheService;

  constructor() {
    this.categoryCacheService = new CategoryCacheService();
  }

  buildSearchQuery(query: string): string {
    if (!query || query.trim() === '') return '*';

    const normalizedQuery = normalizeText(query);
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '*';

    const searchField = 'searchContent';

    const wordQueries = words
      .map((word) => word.replace(/[^a-z0-9]/g, ''))
      .filter(Boolean)
      .map((word) => `@${searchField}:(${word}*)`);

    if (wordQueries.length === 0) return '*';

    return wordQueries.join(' ');
  }

  async searchProducts(
    query: string,
    categoryId?: string | undefined,
    slug?: string | undefined,
    sortBy: string = 'createdAt',
    sortDirection: string = 'desc',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    products: any[];
    total: number;
  }> {
    try {
      if (slug) {
        const slugForSearch = slug.replace(/-/g, ' ');

        const result = (await redis.call(
          'FT.SEARCH',
          this.indexName,
          `@slug:"${slugForSearch}" @status:{active}`,
          'SORTBY',
          sortBy === 'price' ? 'minPrice' : sortBy,
          sortDirection.toUpperCase(),
          'LIMIT',
          (page - 1) * limit,
          limit,
        )) as any[];

        const total = result[0] as number;
        const products = [];

        for (let i = 1; i < result.length; i += 2) {
          const productKey = result[i] as string;
          const productData = result[i + 1] as any[];

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
            } else {
              product[key] = value;
            }
          }

          products.push(product);
        }

        return {
          products,
          total,
        };
      }

      let searchQuery = this.buildSearchQuery(query);

      if (searchQuery === '*') {
        searchQuery = '';
      }

      if (searchQuery) {
        searchQuery = `(${searchQuery})`;
      }

      if (categoryId) {
        const ids = await this.categoryCacheService.getDescendantCategoryIds(
          categoryId,
        );
        const tag = ids.map((id) => escapedCategoryId(id)).join('|');
        const categoryFilter = `@categoryId:{${tag}}`;
        searchQuery = searchQuery
          ? `${searchQuery} ${categoryFilter}`
          : categoryFilter;
      }

      const statusFilter = `@status:{active}`;
      searchQuery = searchQuery
        ? `${searchQuery} ${statusFilter}`
        : statusFilter;

      let sortField = 'createdAt';
      if (sortBy === 'ratingAverage') {
        sortField = 'ratingAverage';
      } else if (sortBy === 'name') {
        sortField = 'name';
      } else if (sortBy === 'price') {
        sortField = 'minPrice';
      }

      const offset = (page - 1) * limit;

      const result = (await redis.call(
        'FT.SEARCH',
        this.indexName,
        searchQuery,
        'SORTBY',
        sortField,
        sortDirection.toUpperCase(),
        'LIMIT',
        offset,
        limit,
      )) as any[];

      const total = result[0] as number;
      const products = [];

      for (let i = 1; i < result.length; i += 2) {
        const productKey = result[i] as string;
        const productData = result[i + 1] as any[];

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
          } else {
            product[key] = value;
          }
        }

        const cleanedProduct = removeSearchFields(product);
        products.push(cleanedProduct);
      }

      return {
        products,
        total,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async searchProductsByProductId(
    productId: string,
  ): Promise<ProductResponseDto[]> {
    try {
      if (!productId || productId.trim() === '') {
        return [];
      }

      // Sử dụng HGETALL trực tiếp thay vì FT.SEARCH vì tìm theo ID cụ thể
      const productKey = `product:${productId}`;
      const productData = await redis.hgetall(productKey);

      if (!productData || Object.keys(productData).length === 0) {
        return [];
      }

      // Chỉ trả về nếu status là active
      if (productData.status !== 'active') {
        return [];
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

      const cleanedProduct = removeSearchFields(product);

      return [cleanedProduct];
    } catch (error) {
      console.error(`Error searching product by ID ${productId}:`, error);
      return [];
    }
  }
}
