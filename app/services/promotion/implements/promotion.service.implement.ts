import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data_source';
import { IPromotionService } from '../promotion.service.interface';
import {
  CreatePromotionRequestDto,
  UpdatePromotionRequestDto,
} from '../../../dtos/request/promotion/promotion.request';
import { PromotionResponseDto } from '../../../dtos/response/promotion/promotion.response';
import { PromotionRepository } from '../../../repositories/promotion.repository';
import { Variant } from '../../../models/variant.model';
import PromotionType from '../../../models/enum/promotional_type.enum';
import { ProductRepository } from '../../../repositories/product.repository';
import { ProductCacheService } from '../../product/implements/product_cache.service.implement';
import { isEffectiveNow } from '../../../utils/promotion.util';
import { RedisSearchService } from '../../redis_search/implements/redis_search.service.implement';
import PromotionStatus from '../../../models/enum/promotion.enum';

export class PromotionService implements IPromotionService {
  private readonly repo = new PromotionRepository();
  private readonly variantRepo: Repository<Variant>;
  private readonly productRepo = new ProductRepository();
  private readonly productCache = new ProductCacheService();
  private readonly redisService = new RedisSearchService();

  constructor() {
    this.variantRepo = AppDataSource.getRepository(Variant);
  }
  getPromotions(params: {
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
    return this.repo.getPromotions(params);
  }

  async create(dto: CreatePromotionRequestDto): Promise<PromotionResponseDto> {
    let productIds: string[] = [];

    if (dto.categoryId) {
      let categoryProducts = [];
      let page = 1;
      let limit = 100;

      while (true) {
        const result = await this.redisService.searchProducts(
          '',
          dto.categoryId,
          undefined,
          'createdAt',
          'desc',
          page,
          limit,
        );
        categoryProducts.push(...result.products);

        if (result.products.length < limit) {
          break;
        }
        page += 1;
      }

      productIds = categoryProducts.map((p: any) => p.id);
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

    const created = await this.repo.create({
      ...dto,
      status: PromotionStatus.DRAFT,
      active: false,
    });

    return created;
  }

  async update(dto: UpdatePromotionRequestDto): Promise<PromotionResponseDto> {
    const existing = await this.repo.getById(dto.id);

    if (existing.status !== PromotionStatus.DRAFT) {
      throw new Error('Chỉ có thể cập nhật promotion khi ở trạng thái DRAFT');
    }

    const updated = await this.repo.update({
      ...dto,
    });

    return updated;
  }

  async submit(id: string): Promise<PromotionResponseDto> {
    const promotion = await this.repo.getById(id);

    if (promotion.status !== PromotionStatus.DRAFT) {
      throw new Error('Chỉ có thể submit promotion khi ở trạng thái DRAFT');
    }
    promotion.status = PromotionStatus.SUBMITTED;
    await this.repo.update({ id, status: PromotionStatus.SUBMITTED });

    await this.activate(id);

    return promotion;
  }

  async activate(id: string): Promise<void> {
    const p = await this.repo.getById(id);

    await this.repo.deactivateAllForProducts(p.products.map((p) => p.id));

    await this.repo.update({ id, active: true });

    if (isEffectiveNow(p.startDate || null, p.endDate || null)) {
      for (const product of p.products) {
        await this.applyToVariants(product.id, p.type, p.value, p.note);
      }
    }
  }

  async delete(id: string): Promise<string> {
    const existing = await this.repo.getById(id);

    for (const product of existing.products) {
      await this.removeFromVariants(product.id);
    }

    const deletedId = await this.repo.delete(id);
    return deletedId;
  }

  async deactivate(id: string): Promise<void> {
    const p = await this.repo.getById(id);
    await this.repo.update({ id, active: false });

    for (const product of p.products) {
      await this.removeFromVariants(product.id);
    }
  }

  async getById(id: string): Promise<PromotionResponseDto> {
    return this.repo.getById(id);
  }

  private async applyToVariants(
    productId: string,
    type: PromotionType,
    value: number,
    note?: string,
  ) {
    const product = await this.productRepo.getProductEntityById(productId);
    const variants = (product.variants || []).map((v: any) => {
      const discountPrice =
        type === PromotionType.PERCENTAGE
          ? Math.max(0, parseFloat((v.price * (1 - value / 100)).toFixed(2)))
          : Math.max(0, parseFloat((v.price - value).toFixed(2)));
      const discountPercent =
        type === PromotionType.PERCENTAGE
          ? value
          : v.price > 0
          ? Math.min(100, parseFloat(((value / v.price) * 100).toFixed(2)))
          : 0;
      return {
        ...v,
        onSales: true,
        discountPrice,
        discountPercent,
        saleNote: note || 'Promotion',
      };
    });
    await this.variantRepo.save(variants);
    await this.productCache.indexProduct({ ...product, variants } as any);
  }

  private async removeFromVariants(productId: string) {
    const product = await this.productRepo.getProductEntityById(productId);
    const variants = (product.variants || []).map((v: any) => ({
      ...v,
      onSales: false,
      discountPrice: 0,
      discountPercent: 0,
      saleNote: '',
    }));
    await this.variantRepo.save(variants);
    await this.productCache.indexProduct({ ...product, variants } as any);
  }

  private calculateActiveStatus(
    startDate?: Date | null,
    endDate?: Date | null,
  ): boolean {
    if (!startDate && !endDate) {
      return true;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (startDate) {
      const promotionStart = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );

      if (promotionStart > today) {
        return false;
      }
    }

    if (endDate) {
      const promotionEnd = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );

      if (promotionEnd < today) {
        return false;
      }
    }

    return true;
  }
}
