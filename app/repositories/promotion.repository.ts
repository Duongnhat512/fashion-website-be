import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { Promotion } from '../models/promotion.model';
import { PromotionProduct } from '../models/promotion_product.model';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
import {
  CreatePromotionRequestDto,
  UpdatePromotionRequestDto,
} from '../dtos/request/promotion/promotion.request';
import { PromotionResponseDto } from '../dtos/response/promotion/promotion.response';
import PromotionStatus from '../models/enum/promotion.enum';
// ... các imports khác

export class PromotionRepository {
  private readonly repo: Repository<Promotion>;
  private readonly promotionProductRepo: Repository<PromotionProduct>;
  private readonly productRepo: Repository<Product>;
  private readonly categoryRepo: Repository<Category>;

  constructor() {
    this.repo = AppDataSource.getRepository(Promotion);
    this.promotionProductRepo = AppDataSource.getRepository(PromotionProduct);
    this.productRepo = AppDataSource.getRepository(Product);
    this.categoryRepo = AppDataSource.getRepository(Category);
  }

  private async getProductsByCategory(
    categoryId: string,
    includeSubcategories: boolean = true,
  ): Promise<Product[]> {
    if (includeSubcategories) {
      const categoryIds = await this.getAllCategoryIdsRecursive(categoryId);

      return this.productRepo.find({
        where: { category: { id: In(categoryIds) } },
      });
    } else {
      return this.productRepo.find({
        where: { category: { id: categoryId } },
      });
    }
  }

  private async getAllCategoryIdsRecursive(
    categoryId: string,
  ): Promise<string[]> {
    const categoryIds: string[] = [categoryId];

    const getChildren = async (parentId: string) => {
      const children = await this.categoryRepo.find({
        where: { parent: { id: parentId } },
      });

      for (const child of children) {
        categoryIds.push(child.id);
        await getChildren(child.id);
      }
    };

    await getChildren(categoryId);
    return categoryIds;
  }

  async create(dto: CreatePromotionRequestDto): Promise<PromotionResponseDto> {
    let productIds: string[] = [];
    let category: Category | null = null;

    if (dto.categoryId) {
      category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
      if (!category) {
        throw new Error('Category not found');
      }

      const categoryProducts = await this.getProductsByCategory(
        dto.categoryId,
        true,
      );
      productIds = categoryProducts.map((p) => p.id);
    }

    if (dto.productIds && dto.productIds.length > 0) {
      const productIdsSet = new Set([...productIds, ...dto.productIds]);
      productIds = Array.from(productIdsSet);
    }

    if (productIds.length === 0) {
      throw new Error(
        'Phải chọn ít nhất 1 sản phẩm (qua productIds hoặc categoryId)',
      );
    }

    const promotion = this.repo.create({
      type: dto.type,
      value: dto.value,
      name: dto.name,
      category: category || undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      active: dto.active ?? true,
      note: dto.note,
    });
    const saved = await this.repo.save(promotion);

    const products = await this.productRepo.findBy({
      id: In(productIds),
    });

    if (products.length !== productIds.length) {
      throw new Error('Một số sản phẩm không tồn tại');
    }

    const promotionProducts = products.map((product) =>
      this.promotionProductRepo.create({
        promotion: saved,
        product,
      }),
    );
    await this.promotionProductRepo.save(promotionProducts);

    return this.getById(saved.id);
  }

  async update(dto: UpdatePromotionRequestDto): Promise<PromotionResponseDto> {
    const existing = await this.repo.findOne({
      where: { id: dto.id },
      relations: { category: true },
    });

    if (!existing) {
      throw new Error('Promotion not found');
    }

    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
      if (!category) {
        throw new Error('Category not found');
      }
    }

    Object.assign(existing, {
      type: dto.type ?? existing.type,
      value: dto.value ?? existing.value,
      name: dto.name ?? existing.name,
      category: category ?? existing.category,
      startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : existing.endDate,
      active: dto.active ?? existing.active,
      note: dto.note ?? existing.note,
      status: dto.status ?? existing.status,
    });

    const saved = await this.repo.save(existing);

    if (dto.productIds || dto.categoryId) {
      let productIds: string[] = [];

      if (dto.categoryId) {
        const categoryProducts = await this.getProductsByCategory(
          dto.categoryId,
          true,
        );
        productIds = categoryProducts.map((p) => p.id);
      }

      if (dto.productIds && dto.productIds.length > 0) {
        const productIdsSet = new Set([...productIds, ...dto.productIds]);
        productIds = Array.from(productIdsSet);
      }

      await this.promotionProductRepo.delete({ promotion: { id: dto.id } });

      const products = await this.productRepo.findBy({ id: In(productIds) });
      if (products.length !== productIds.length) {
        throw new Error('Một số sản phẩm không tồn tại');
      }

      const promotionProducts = products.map((product) =>
        this.promotionProductRepo.create({
          promotion: saved,
          product,
        }),
      );
      await this.promotionProductRepo.save(promotionProducts);
    }

    return this.getById(saved.id);
  }

  async delete(id: string): Promise<string> {
    const deleted = await this.repo.delete(id);
    if (deleted.affected === 0) {
      throw new Error('Promotion not found');
    }
    return id;
  }

  async getById(id: string): Promise<PromotionResponseDto> {
    const p = await this.repo.findOne({
      where: { id },
      relations: {
        promotionProducts: { product: true },
        category: true,
      },
    });
    if (!p) throw new Error('Promotion not found');
    return this.toDto(p);
  }

  private toDto = (p: Promotion): PromotionResponseDto => ({
    id: p.id,
    products: p.promotionProducts.map((pp) => pp.product),
    categoryId: p.category?.id || null,
    categoryName: p.category?.name || null,
    type: p.type,
    value: p.value,
    name: p.name,
    startDate: p.startDate || null,
    endDate: p.endDate || null,
    active: p.active,
    note: p.note,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    status: p.status,
  });

  async deactivateAllForProducts(productIds: string[]): Promise<void> {
    if (productIds.length === 0) return;

    const promotionProducts = await this.promotionProductRepo.find({
      where: { product: { id: In(productIds) } },
      relations: { promotion: true },
    });

    const promotionIds = [
      ...new Set(promotionProducts.map((pp) => pp.promotion.id)),
    ];

    if (promotionIds.length > 0) {
      await this.repo.update(
        { id: In(promotionIds), active: true },
        { active: false },
      );
    }
  }

  async getPromotions(params: {
    page?: number;
    limit?: number;
    productId?: string;
    categoryId?: string;
    active?: boolean;
  }): Promise<{
    data: PromotionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, productId, categoryId, active } = params;

    const where: any = {};
    if (productId) {
      where.promotionProducts = { product: { id: productId } };
    }
    if (categoryId) {
      where.category = { id: categoryId };
    }
    if (active) {
      where.active = active;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: {
        promotionProducts: { product: true },
        category: true,
      },
    });
    return {
      data: data.map(this.toDto),
      total,
      page,
      limit,
    };
  }

  async submit(id: string): Promise<PromotionResponseDto> {
    const promotion = await this.repo.findOneBy({ id });
    if (!promotion) {
      throw new Error('Promotion not found');
    }
    promotion.status = PromotionStatus.SUBMITTED;
    await this.repo.save(promotion);
    return this.getById(id);
  }

  async deactivateAllForProductsExcept(
    productIds: string[],
    excludePromotionId: string,
  ): Promise<void> {
    if (productIds.length === 0) return;

    const promotionProducts = await this.promotionProductRepo.find({
      where: { product: { id: In(productIds) } },
      relations: { promotion: true },
    });

    const promotionIds = [
      ...new Set(
        promotionProducts
          .filter(
            (pp) =>
              pp.promotion.id !== excludePromotionId &&
              pp.promotion.active === true &&
              pp.promotion.status === PromotionStatus.SUBMITTED,
          )
          .map((pp) => pp.promotion.id),
      ),
    ];

    if (promotionIds.length > 0) {
      // Deactivate các promotions cũ
      await this.repo.update({ id: In(promotionIds) }, { active: false });
    }
  }
}
