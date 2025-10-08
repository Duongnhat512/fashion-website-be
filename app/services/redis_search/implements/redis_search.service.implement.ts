import redis from '../../../config/redis.config';
import { escapedCategoryId, normalizeText } from '../../../utils/product.util';
import { ICategoryCacheService } from '../../../services/category/category_cache.service.interface';
import { CategoryCacheService } from '../../../services/category/implements/category_cache.service.implement';
import { IRedisSearchService } from '../redis_search.service.interface';

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

    const fields = [
      'nameNormalized',
      'shortDescriptionNormalized',
      'brandNormalized',
      'tagsNormalized',
    ];

    const groups = words.map((w) => {
      const ors = fields.map((f) => `@${f}:(${w}*)`).join(' | ');
      return `(${ors})`;
    });

    const finalQuery = groups.join(' ');
    return finalQuery;
  }

  async searchProducts(
    query: string,
    categoryId?: string,
    sortBy: string = 'createdAt',
    sortDirection: string = 'desc',
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    products: any[];
    total: number;
  }> {
    try {
      let searchQuery = this.buildSearchQuery(query);

      if (searchQuery === '*') {
        searchQuery = '';
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

        products.push(product);
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
}
