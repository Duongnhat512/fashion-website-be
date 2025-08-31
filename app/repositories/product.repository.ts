import { Product } from '../models/product.model';
import { Like, Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../dtos/response/product/product.response';

export class ProductRepository {
  private readonly productRepository: Repository<Product>;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async createProduct(product: Product): Promise<ProductResponseDto> {
    const newProduct = await this.productRepository.save(product);
    return {
      ...newProduct,
      categoryId: newProduct.category.id,
    };
  }

  async updateProduct(product: Product): Promise<Product> {
    return this.productRepository.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        variants: {
          color: true,
        },
        category: true,
      },
    });
    if (!product) {
      throw new Error('Product not found');
    }
    return {
      ...product,
      categoryId: product.category?.id,
    };
  }

  async getAllProducts(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        variants: {
          color: true,
        },
        category: true,
      },
    });
    return {
      products: products.map((product) => ({
        ...product,
        categoryId: product.category?.id,
        category: undefined,
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        page,
        limit,
      },
    };
  }

  async searchProducts(
    search: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    const [products, total] = await this.productRepository.findAndCount({
      where: { name: Like(`%${search}%`) },
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        variants: {
          color: true,
        },
        category: true,
      },
    });
    return {
      products: products.map((product) => ({
        ...product,
        categoryId: product.category?.id,
        category: undefined,
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        page,
        limit,
      },
    };
  }

  async filterProducts(
    categoryId: string,
    sort: string = 'desc',
    sortBy: string = 'createdAt',
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    let where: any = {};

    if (categoryId) {
      where.category = { id: categoryId };
    }

    const [products, total] = await this.productRepository.findAndCount({
      where: where,
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        variants: {
          color: true,
        },
        category: true,
      },
      order: {
        [sortBy]: sort.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      },
    });

    return {
      products: products.map((product) => ({
        ...product,
        categoryId: product.category?.id,
        category: undefined,
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        page,
        limit,
      },
    };
  }
}
