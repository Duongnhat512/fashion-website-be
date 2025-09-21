import { Product } from '../models/product.model';
import { Like, Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../dtos/response/product/product.response';
import { ProductRequestDto } from '../dtos/request/product/product.request';

export class ProductRepository {
  private readonly productRepository: Repository<Product>;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async createProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    const newProduct = await this.productRepository.save({
      ...product,
      category: {
        id: product.categoryId,
      },
    });
    return this.getProductById(newProduct.id);
  }

  async updateProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    const updatedProduct = await this.productRepository.save(product);
    return {
      ...updatedProduct,
      categoryId: updatedProduct.category.id,
    };
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
    if (sortBy === 'price') {
      return this.filterProductsByPrice(categoryId, sort, page, limit);
    }

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

  async filterProductsByPrice(
    categoryId: string,
    sort: string = 'desc',
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedProductsResponseDto> {
    const direction = sort.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const where: any = {};
    if (categoryId) {
      where.category = { id: categoryId };
    }

    const total = await this.productRepository.count({ where });

    const qb = this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        (sub) =>
          sub
            .from(Product, 'p')
            .leftJoin('p.variants', 'v')
            .select('p.id', 'productId')
            .addSelect('MIN(v.price)', 'minPrice')
            .groupBy('p.id'),
        'mv',
        'mv.productId = product.id',
      )
      .addSelect('mv.minPrice', 'minPrice')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('variant.color', 'color')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    const products = await qb
      .orderBy('minPrice', direction as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

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
  async getProductEntityById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        category: true,
      },
    });
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async getAllProductsForIndexing(): Promise<Product[]> {
    return this.productRepository.find({
      relations: {
        category: true,
      },
    });
  }
}
