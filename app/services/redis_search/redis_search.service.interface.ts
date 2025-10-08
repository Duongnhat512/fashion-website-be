export interface IRedisSearchService {
  buildSearchQuery(query: string): string;
  searchProducts(
    query: string,
    categoryId?: string,
    sortBy?: string,
    sortDirection?: string,
    page?: number,
    limit?: number,
  ): Promise<{
    products: any[];
    total: number;
  }>;
}
