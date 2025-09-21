import redis from '../../config/redis.config';
import { Product } from '../../models/product.model';

export class RedisSearchService {
  private readonly indexName = 'idx:products';

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
        'WEIGHT',
        '3.0',
        'shortDescription',
        'TEXT',
        'WEIGHT',
        '2.0',
        'brand',
        'TEXT',
        'WEIGHT',
        '1.5',
        'tags',
        'TEXT',
        'WEIGHT',
        '1.0',
        'categoryId',
        'TAG',
        'status',
        'TAG',
        'ratingAverage',
        'NUMERIC',
        'SORTABLE',
        'createdAt',
        'NUMERIC',
        'SORTABLE',
      );
    } catch (error) {
      console.error('Error creating product search index:', error);
      throw error;
    }
  }

  async indexProduct(product: Product): Promise<void> {
    try {
      const productData = {
        id: product.id,
        name: this.normalizeText(product.name),
        shortDescription: this.normalizeText(product.shortDescription),
        brand: this.normalizeText(product.brand || ''),
        tags: this.normalizeText(product.tags || ''),
        categoryId: product.category?.id || '',
        status: product.status,
        ratingAverage: product.ratingAverage,
        createdAt: product.createdAt.getTime(),
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

      if (categoryId) {
        searchQuery += ` @categoryId:{${categoryId}}`;
      }

      searchQuery += ` @status:{active}`;

      let sortField = 'createdAt';
      if (sortBy === 'ratingAverage') {
        sortField = 'ratingAverage';
      } else if (sortBy === 'name') {
        sortField = 'name';
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

          if (key === 'createdAt') {
            product[key] = new Date(parseInt(value));
          } else if (key === 'ratingAverage') {
            product[key] = parseFloat(value);
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

  async reindexAllProducts(products: Product[]): Promise<void> {
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
