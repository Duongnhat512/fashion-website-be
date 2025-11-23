import {
  ProductRequestDto,
  UpdateProductRequestDto,
} from '../../dtos/request/product/product.request';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../../dtos/response/product/product.response';

export interface IProductService {
  createProduct(product: ProductRequestDto): Promise<ProductResponseDto>;
  updateProduct(product: UpdateProductRequestDto): Promise<ProductResponseDto>;
  deleteProduct(id: string): Promise<void>;
  getProductById(id: string): Promise<ProductResponseDto>;
  getProductBySlug(slug: string): Promise<ProductResponseDto | null>;
  getProductByName(name: string): Promise<ProductResponseDto | null>;
  getAllProducts(
    page: number,
    limit: number,
  ): Promise<PaginatedProductsResponseDto>;
  searchProducts(
    search: string,
    categoryId?: string,
    slug?: string,
    sort?: string,
    sortBy?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedProductsResponseDto>;
  createProductWithId(product: ProductRequestDto): Promise<ProductResponseDto>;
  searchProductsByProductId(productId: string): Promise<ProductResponseDto[]>;
  updateUserPreference(
    userId: number,
    productEmbedding: number[],
    weight: number,
  ): Promise<void>;
  getProductEmbedding(productId: string): Promise<number[] | null>;
  getProductByVariantId(variantId: string): Promise<ProductResponseDto | null>;
}
