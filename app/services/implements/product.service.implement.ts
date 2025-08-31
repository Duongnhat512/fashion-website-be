import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../../dtos/response/product/product.response';
import { Product } from '../../models/product.model';
import { ProductRepository } from '../../repositories/product.repository';
import { IProductService } from '../product.service.interface';

export class ProductService implements IProductService {
  private readonly productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }
  updateProduct(product: Product): Promise<ProductResponseDto> {
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
  getProductsByCategoryId(
    categoryId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productRepository.getProductsByCategoryId(
      categoryId,
      page,
      limit,
    );
  }

  async createProduct(product: Product): Promise<ProductResponseDto> {
    return this.productRepository.createProduct(product);
  }
}
