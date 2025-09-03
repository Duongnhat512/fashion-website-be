import { ProductRequestDto } from '../dtos/request/product/product.request';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../dtos/response/product/product.response';

export interface IProductService {
  createProduct(product: ProductRequestDto): Promise<ProductResponseDto>;
  updateProduct(product: ProductRequestDto): Promise<ProductResponseDto>;
  deleteProduct(id: string): Promise<void>;
  getProductById(id: string): Promise<ProductResponseDto>;
  getAllProducts(
    page: number,
    limit: number,
  ): Promise<PaginatedProductsResponseDto>;
  searchProducts(
    search: string,
    page: number,
    limit: number,
  ): Promise<PaginatedProductsResponseDto>;
  filterProducts(
    categoryId: string,
    sort: string,
    sortBy: string,
    page: number,
    limit: number,
  ): Promise<PaginatedProductsResponseDto>;
}
