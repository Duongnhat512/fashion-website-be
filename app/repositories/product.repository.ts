import { Product } from '../models/product.model';
import { DataSource, Like, Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import {
  PaginatedProductsResponseDto,
  ProductResponseDto,
} from '../dtos/response/product/product.response';
import {
  ProductRequestDto,
  UpdateProductRequestDto,
} from '../dtos/request/product/product.request';
import { Warehouse } from '../models/warehouse.model';
import { Inventory } from '../models/inventory.model';

export class ProductRepository {
  private readonly productRepository: Repository<Product>;
  private readonly dataSource: DataSource;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Product);
    this.dataSource = AppDataSource;
  }

  async createProduct(product: ProductRequestDto): Promise<ProductResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Tạo product với variants
      const newProduct = await manager.save(Product, {
        ...product,
      });

      // 2. Lấy tất cả các warehouse
      const warehouseRepo = manager.getRepository(Warehouse);
      const allWarehouses = await warehouseRepo.find();

      // 3. Nếu có variants và có warehouses, tạo inventory cho mỗi variant trong mỗi kho
      if (newProduct.variants && newProduct.variants.length > 0 && allWarehouses.length > 0) {
        const inventoryRepo = manager.getRepository(Inventory);
        
        // Tạo inventory cho tất cả các variant trong tất cả các kho
        const inventoryPromises = [];
        for (const variant of newProduct.variants) {
          for (const warehouse of allWarehouses) {
            const inventory = inventoryRepo.create({
              warehouse: warehouse,
              variant: variant,
              onHand: 0,
            });
            inventoryPromises.push(inventoryRepo.save(inventory));
          }
        }

        await Promise.all(inventoryPromises);
        
        console.log(`Created ${inventoryPromises.length} inventory records for ${newProduct.variants.length} variants across ${allWarehouses.length} warehouses`);
      }

      // 4. Lấy lại product với đầy đủ relations trong cùng transaction
      const productRepo = manager.getRepository(Product);
      const createdProduct = await productRepo.findOne({
        where: { id: newProduct.id },
        relations: {
          variants: {
            color: true,
          },
          category: true,
        },
      });

      if (!createdProduct) {
        throw new Error('Failed to retrieve created product');
      }

      return {
        ...createdProduct,
        categoryId: createdProduct.category?.id,
        brand: createdProduct.brand ?? '',
        createdAt: createdProduct.createdAt,
        updatedAt: createdProduct.updatedAt,
      };
    });
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
}
