import { ProductResponseDto } from '../../dtos/response/product/product.response';

export interface IProductCacheService {
  indexProduct(product: ProductResponseDto): Promise<void>;
  removeProduct(productId: string): Promise<void>;
  getProduct(productId: string): Promise<any | null>;
  getProducts(productIds: string[]): Promise<any[]>;
  existsProduct(productId: string): Promise<boolean>;
  updateProductField(
    productId: string,
    field: string,
    value: any,
  ): Promise<void>;
  getAllProductKeys(): Promise<string[]>;
  clearAllProducts(): Promise<void>;
  getCacheStats(): Promise<{ totalProducts: number; memoryUsage: string }>;
  resetIndex(): Promise<void>;
  reindexAllProducts(): Promise<void>;
  updateProductRating(
    productId: string,
    ratingAverage: number,
    ratingCount: number,
  ): Promise<void>;
}
