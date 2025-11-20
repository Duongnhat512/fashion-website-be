import { Product } from '../models/product.model';
import { Like, Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../dtos/response/product/product.response';
import {
  ProductRequestDto,
  UpdateProductRequestDto,
} from '../dtos/request/product/product.request';

export class ProductRepository {
  private readonly productRepository: Repository<Product>;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async createProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    const newProduct = this.productRepository.create({
      ...product,
      id: undefined,
    });

    await this.productRepository.save(newProduct);

    return this.getProductById(newProduct.id);
  }

  async updateProduct(
    product: UpdateProductRequestDto,
  ): Promise<ProductResponseDto> {
    const updatedProduct = await this.productRepository.save({
      ...product,
    });
    return {
      ...updatedProduct,
      categoryId: updatedProduct.category?.id,
      brand: updatedProduct.brand ?? '',
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
    };
  }

  async deleteProduct(id: string): Promise<string> {
    await this.productRepository.delete(id);
    return id;
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
      throw new Error('Không tìm thấy sản phẩm.');
    }
    return {
      ...product,
      categoryId: product.category?.id,
      brand: product.brand ?? '',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
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
        brand: product.brand ?? '',
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
        brand: product.brand ?? '',
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
        brand: product.brand ?? '',
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
  async getProductEntityById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        category: true,
        variants: {
          color: true,
        },
      },
    });
    if (!product) {
      throw new Error('Product not found');
    }
    return {
      ...product,
      categoryId: product.category?.id,
      brand: product.brand ?? '',
    };
  }

  async getAllProductsForIndexing(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      relations: {
        variants: {
          color: true,
        },
        category: true,
      },
    });
    return products.map((product) => ({
      ...product,
      categoryId: product.category?.id,
      category: undefined,
      brand: product.brand ?? '',
    }));
  }

  async getAll(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      relations: {
        variants: {
          color: true,
        },
        category: true,
      },
    });
    return products.map((product) => ({
      ...product,
      categoryId: product.category?.id,
      categoryName: product.category?.name,
      category: undefined,
      brand: product.brand ?? '',
    }));
  }

  async updateProductRating(
    id: string,
    ratingAverage: number,
    ratingCount: number,
  ): Promise<void> {
    await this.productRepository.update(id, {
      ratingAverage,
      ratingCount,
      updatedAt: new Date(),
    });
  }

  async getProductBySlug(slug: string): Promise<ProductResponseDto | null> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: {
        category: true,
      },
    });
    if (!product) {
      return null;
    }
    return {
      ...product,
      categoryId: product.category?.id,
      brand: product.brand ?? '',
    };
  }

  async getProductByName(name: string): Promise<ProductResponseDto | null> {
    const product = await this.productRepository.findOne({
      where: { name },
      relations: {
        category: true,
      },
    });
    if (!product) {
      return null;
    }
    return {
      ...product,
      categoryId: product.category?.id,
      brand: product.brand ?? '',
    };
  }

  async createProductWithId(
    product: ProductRequestDto,
  ): Promise<ProductResponseDto> {
    await this.productRepository.save(product);

    return this.getProductById(product.id!);
  }
}
