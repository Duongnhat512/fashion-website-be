import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../../dtos/response/product/product.response';
import { ProductRepository } from '../../repositories/product.repository';
import { IProductService } from '../product.service.interface';
import {
  ProductRequestDto,
  UpdateProductRequestDto,
} from '../../dtos/request/product/product.request';
import { RedisSearchService } from './redis_search.service.implement';

export class ProductService implements IProductService {
  private readonly productRepository: ProductRepository;
  private readonly redisSearchService: RedisSearchService;

  constructor() {
    this.productRepository = new ProductRepository();
    this.redisSearchService = new RedisSearchService();
  }

  async createProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    const newProduct = await this.productRepository.createProduct(product);

    try {
      const productEntity = await this.productRepository.getProductEntityById(
        newProduct.id,
      );
      await this.redisSearchService.indexProduct(productEntity);
    } catch (error) {
      console.error('Error indexing new product:', error);
    }

    return newProduct;
  }

  async updateProduct(
    product: UpdateProductRequestDto,
  ): Promise<ProductResponseDto> {
    await this.productRepository.updateProduct(product);

    let updatedProduct: ProductResponseDto = {} as ProductResponseDto;
    try {
      updatedProduct = await this.productRepository.getProductById(product.id);
      await this.redisSearchService.indexProduct(updatedProduct);
    } catch (error) {
      console.error('Error updating product index:', error);
    }
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productRepository.deleteProduct(id);

    try {
      await this.redisSearchService.removeProduct(id);
    } catch (error) {
      console.error('Error removing product from index:', error);
    }
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    return this.productRepository.getProductById(id);
  }

  async getAllProducts(
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
    try {
      const searchResult = await this.redisSearchService.searchProducts(
        search,
        undefined,
        'createdAt',
        'desc',
        page,
        limit,
      );

      return {
        products: searchResult.products,
        pagination: {
          total: searchResult.total,
          totalPages: Math.ceil(searchResult.total / limit),
          hasNext: page * limit < searchResult.total,
          hasPrev: page > 1,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error(
        'Redis search failed, falling back to database search:',
        error,
      );
      return this.productRepository.searchProducts(search, page, limit);
    }
  }

  async filterProducts(
    categoryId: string,
    sort: string = 'desc',
    sortBy: string = 'createdAt',
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    try {
      const products = await this.redisSearchService.searchProducts(
        '',
        categoryId,
        sortBy,
        sort,
        page,
        limit,
      );

      return {
        products: products.products as ProductResponseDto[],
        pagination: {
          total: products.total,
          totalPages: Math.ceil(products.total / limit),
          hasNext: page * limit < products.total,
          hasPrev: page > 1,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error(
        'Redis search failed, falling back to database search:',
        error,
      );
      return [] as any as PaginatedProductsResponseDto;
    }
  }

  async initializeSearchIndex(): Promise<void> {
    try {
      await this.redisSearchService.reindexAllProducts();
    } catch (error) {
      console.error('Error initializing search index:', error);
      throw error;
    }
  }
}
