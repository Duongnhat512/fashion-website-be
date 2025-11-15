import { ProductResponseDto } from '../../dtos/response/product/product.response';

export interface IRedisSearchService {
  buildSearchQuery(query: string): string;
  searchProducts(
    query: string,
    categoryId?: string,
    slug?: string,
    sortBy?: string,
    sortDirection?: string,
    page?: number,
    limit?: number,
  ): Promise<{
    products: any[];
    total: number;
  }>;
  searchProductsByProductId(productId: string): Promise<ProductResponseDto[]>;
}
