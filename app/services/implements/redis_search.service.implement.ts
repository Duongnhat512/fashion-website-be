import redis from '../../config/redis.config';
import { ProductResponseDto } from '../../dtos/response/product/product.response';
import { CategoryRepository } from '../../repositories/category.repository';
import { escapedCategoryId } from '../../utils/product.util';

export class RedisSearchService {
  private readonly indexName = 'idx:products';
  private readonly categoryRepository = new CategoryRepository();

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
      );
    } catch (error) {
      console.error('Error creating product search index:', error);
      throw error;
    }
  }

  private getMinPrice(variants: any[]): number {
    if (!variants || variants.length === 0) return 0;
    const prices = variants
      .map((v) => (v.onSales ? v.discountPrice : v.price))
      .filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  private getMaxPrice(variants: any[]): number {
    if (!variants || variants.length === 0) return 0;
    const prices = variants
      .map((v) => (v.onSales ? v.discountPrice : v.price))
      .filter((p) => p > 0);
    return prices.length > 0 ? Math.max(...prices) : 0;
  }

  async indexProduct(product: ProductResponseDto): Promise<void> {
    try {
      const productData = {
        id: product.id,
        name: this.normalizeText(product.name),
        slug: product.slug,
        shortDescription: this.normalizeText(product.shortDescription),
        imageUrl: product.imageUrl,
        brand: this.normalizeText(product.brand || ''),
        tags: this.normalizeText(product.tags || ''),
        categoryId: product.categoryId || '',
        status: product.status || 'active',
        ratingAverage: product.ratingAverage,
        ratingCount: product.ratingCount,
        createdAt: product.createdAt.getTime(),
        updatedAt: product.updatedAt.getTime(),
        minPrice: this.getMinPrice(product.variants || []),
        maxPrice: this.getMaxPrice(product.variants || []),
        variants: JSON.stringify(product.variants || []),
      };

      await redis.hset(`product:${product.id}`, productData);
    } catch (error) {
      console.error('Error indexing product:', error);
      throw error;
    }
  }

  async removeProduct(productId: string): Promise<void> {
    try {
      await redis.del(`product:${productId}`);
    } catch (error) {
      console.error('Error removing product from index:', error);
      throw error;
    }
  }

  private normalizeText(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildSearchQuery(query: string): string {
    if (!query || query.trim() === '') {
      return '*';
    }

    const normalizedQuery = this.normalizeText(query);
    const originalQuery = query.toLowerCase().trim();

    const words = normalizedQuery
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length === 0) {
      return '*';
    }

    const searchTerms: string[] = [];

    if (words.length > 1) {
      searchTerms.push(`@name:"${normalizedQuery}"`);
      searchTerms.push(`@shortDescription:"${normalizedQuery}"`);
      searchTerms.push(`@brand:"${normalizedQuery}"`);
      searchTerms.push(`@tags:"${normalizedQuery}"`);

      searchTerms.push(`@name:"${originalQuery}"`);
      searchTerms.push(`@shortDescription:"${originalQuery}"`);
      searchTerms.push(`@brand:"${originalQuery}"`);
      searchTerms.push(`@tags:"${originalQuery}"`);
    }

    words.forEach((word) => {
      searchTerms.push(`@name:(${word}*)`);
      searchTerms.push(`@shortDescription:(${word}*)`);
      searchTerms.push(`@brand:(${word}*)`);
      searchTerms.push(`@tags:(${word}*)`);
    });

    const originalWords = originalQuery
      .split(/\s+/)
      .filter((word) => word.length > 0);
    originalWords.forEach((word) => {
      searchTerms.push(`@name:(${word}*)`);
      searchTerms.push(`@shortDescription:(${word}*)`);
      searchTerms.push(`@brand:(${word}*)`);
      searchTerms.push(`@tags:(${word}*)`);
    });

    const finalQuery = searchTerms.join(' | ');
    return finalQuery;
  }

  private async getDescendantCategoryIds(rootId: string): Promise<string[]> {
    const all = await this.categoryRepository.getAll();
    const childrenMap = new Map<string, string[]>();
    for (const c of all) {
      if (c.parentId) {
        const arr = childrenMap.get(c.parentId) || [];
        arr.push(c.id);
        childrenMap.set(c.parentId, arr);
      }
    }
    const result = new Set<string>([rootId]);
    const stack = [rootId];
    while (stack.length) {
      const cur = stack.pop()!;
      const kids = childrenMap.get(cur) || [];
      for (const kid of kids) {
        if (!result.has(kid)) {
          result.add(kid);
          stack.push(kid);
        }
      }
    }
    return Array.from(result);
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
        const ids = await this.getDescendantCategoryIds(categoryId);
        const tag = ids.map((id) => escapedCategoryId(id)).join('|');
        searchQuery += `@categoryId:{${tag}} `;
      }

      searchQuery += `@status:{active} `;

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
      throw error;
    }
  }

  async reindexAllProducts(products: ProductResponseDto[]): Promise<void> {
    try {
      await this.resetIndex();
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
}
