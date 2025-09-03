import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../../dtos/response/product/product.response';
import { ProductRepository } from '../../repositories/product.repository';
import { IProductService } from '../product.service.interface';
import { ProductRequestDto } from '../../dtos/request/product/product.request';

export class ProductService implements IProductService {
  private readonly productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }
  updateProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    throw new Error('Method not implemented.');
  }
  deleteProduct(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getProductById(id: string): Promise<ProductResponseDto> {
    throw new Error('Method not implemented.');
  }
  getAllProducts(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productRepository.getAllProducts(page, limit);
  }

  async searchProducts(
    search: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productRepository.searchProducts(search, page, limit);
  }

  async filterProducts(
    categoryId: string,
    sort: string = 'desc',
    sortBy: string = 'createdAt',
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productRepository.filterProducts(
      categoryId,
      sort,
      sortBy,
      page,
      limit,
    );
  }

  async createProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    return this.productRepository.createProduct(product);
  }
}
