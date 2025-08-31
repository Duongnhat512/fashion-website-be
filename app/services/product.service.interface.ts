import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../dtos/response/product/product.response';
import { Product } from '../models/product.model';

export interface IProductService {
  createProduct(product: Product): Promise<ProductResponseDto>;
  updateProduct(product: Product): Promise<ProductResponseDto>;
  deleteProduct(id: string): Promise<void>;
  getProductById(id: string): Promise<ProductResponseDto>;
  getAllProducts(
    page: number,
    limit: number,
  ): Promise<PaginatedProductsResponseDto>;
  getProductsByCategoryId(
    categoryId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedProductsResponseDto>;
}
