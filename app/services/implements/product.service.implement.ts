import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../../dtos/response/product/product.response';
import { ProductRepository } from '../../repositories/product.repository';
import { IProductService } from '../product.service.interface';
import { ProductRequestDto } from '../../dtos/request/product/product.request';
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

  async updateProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    const updatedProduct = await this.productRepository.updateProduct(product);

    try {
      const productEntity = await this.productRepository.getProductEntityById(
        updatedProduct.id,
      );
      await this.redisSearchService.indexProduct(productEntity);
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

      const products = await Promise.all(
        searchResult.products.map(async (productData) => {
          try {
            return await this.productRepository.getProductById(productData.id);
          } catch (error) {
            console.error(`Error fetching product ${productData.id}:`, error);
            return null;
          }
        }),
      );

      const validProducts = products.filter((product) => product !== null);

      return {
        products: validProducts,
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
      const allProducts =
        await this.productRepository.getAllProductsForIndexing();
      await this.redisSearchService.reindexAllProducts(allProducts);
    } catch (error) {
      console.error('Error initializing search index:', error);
      throw error;
    }
  }
}
