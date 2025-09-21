import redis from '../../config/redis.config';
import { Product } from '../../models/product.model';

export class RedisSearchService {
  private readonly indexName = 'idx:products';

  async createIndex(): Promise<void> {
    try {
      const exists = await redis.call('FT.INFO', this.indexName);
      if (exists) {
        console.log('Product index already exists');
        return;
      }
    } catch (error) {
      // Index chưa tồn tại, tạo mới
    }

    try {
      // Tạo index với cấu hình phù hợp cho tiếng Việt
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
      console.log('Product search index created successfully');
    } catch (error) {
      console.error('Error creating product search index:', error);
      throw error;
    }
  }

  async indexProduct(product: Product): Promise<void> {
    try {
      // Chuẩn hóa dữ liệu trước khi index
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

  // Hàm normalize text để xử lý tiếng Việt
  private normalizeText(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .trim();
  }

  // Hàm tạo query tìm kiếm thông minh
  private buildSearchQuery(query: string): string {
    if (!query || query.trim() === '') {
      return '*';
    }

    const normalizedQuery = this.normalizeText(query);
    const originalQuery = query.toLowerCase().trim();

    // Tách từ khóa thành các từ riêng lẻ
    const words = normalizedQuery
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length === 0) {
      return '*';
    }

    // Tạo query tìm kiếm với cả normalized và original text
    const searchTerms: string[] = [];

    // Thêm search cho normalized text (không dấu)
    words.forEach((word) => {
      searchTerms.push(`@name:(${word}*)`);
      searchTerms.push(`@shortDescription:(${word}*)`);
      searchTerms.push(`@brand:(${word}*)`);
      searchTerms.push(`@tags:(${word}*)`);
    });

    // Thêm search cho original text (có dấu)
    const originalWords = originalQuery
      .split(/\s+/)
      .filter((word) => word.length > 0);
    originalWords.forEach((word) => {
      searchTerms.push(`@name:(${word}*)`);
      searchTerms.push(`@shortDescription:(${word}*)`);
      searchTerms.push(`@brand:(${word}*)`);
      searchTerms.push(`@tags:(${word}*)`);
    });

    return searchTerms.join(' | ');
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
      // Sử dụng query tìm kiếm thông minh
      let searchQuery = this.buildSearchQuery(query);

      // Thêm filter cho category nếu có
      if (categoryId) {
        searchQuery += ` @categoryId:{${categoryId}}`;
      }

      // Thêm filter cho status active
      searchQuery += ` @status:{active}`;

      // Xác định sort field
      let sortField = 'createdAt'; // Không cần @ prefix cho SORTBY
      if (sortBy === 'ratingAverage') {
        sortField = 'ratingAverage';
      } else if (sortBy === 'name') {
        sortField = 'name';
      }

      const offset = (page - 1) * limit;

      // Thực hiện search với Redis Search
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

      // Parse kết quả từ Redis
      for (let i = 1; i < result.length; i += 2) {
        const productKey = result[i] as string;
        const productData = result[i + 1] as any[];
        const product: any = {};

        // Extract product ID from key
        product.id = productKey.replace('product:', '');

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
      console.error('Error searching products:', error);
      throw error;
    }
  }

  async reindexAllProducts(products: Product[]): Promise<void> {
    try {
      // Xóa index cũ nếu có
      try {
        await redis.call('FT.DROPINDEX', this.indexName);
      } catch (error) {
        // Index có thể không tồn tại
      }

      // Tạo lại index
      await this.createIndex();

      // Index tất cả sản phẩm
      for (const product of products) {
        await this.indexProduct(product);
      }

      console.log(`Reindexed ${products.length} products`);
    } catch (error) {
      console.error('Error reindexing products:', error);
      throw error;
    }
  }
}
