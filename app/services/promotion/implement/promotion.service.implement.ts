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
        page += 1;
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
      }

      productIds = categoryProducts.map((p: any) => p.id);
    }

    if (dto.productIds && dto.productIds.length > 0) {
      const productIdsSet = new Set([...productIds, ...dto.productIds]);
      productIds = Array.from(productIdsSet);
    }

    if (productIds.length > 0) {
      await this.repo.deactivateAllForProducts(productIds);

      for (const productId of productIds) {
        await this.removeFromVariants(productId);
      }
    }

    let shouldBeActive = dto.active ?? true;

    if (dto.startDate) {
      const startDate = new Date(dto.startDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const promotionStart = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );

      const promotionEnd = new Date(dto.endDate);
      const promotionEndDate = new Date(
        promotionEnd.getFullYear(),
        promotionEnd.getMonth(),
        promotionEnd.getDate(),
      );

      if (
        promotionStart > today &&
        promotionStart < now &&
        promotionEndDate > now
      ) {
        shouldBeActive = false;
      } else {
        shouldBeActive = true;
      }
    }

    const created = await this.repo.create({
      ...dto,
      active: shouldBeActive,
    });

    const finalProductIds = created.productIds;

    if (
      created.active &&
      isEffectiveNow(created.startDate || null, created.endDate || null)
    ) {
      for (const productId of finalProductIds) {
        await this.applyToVariants(
          productId,
          created.type,
          created.value,
          created.note,
        );
      }
    }

    return created;
  }

  async activate(id: string): Promise<void> {
    const p = await this.repo.getById(id);

    await this.repo.deactivateAllForProducts(p.productIds);

    for (const productId of p.productIds) {
      await this.removeFromVariants(productId);
    }

    await this.repo.update({ id, active: true });

    if (isEffectiveNow(p.startDate || null, p.endDate || null)) {
      for (const productId of p.productIds) {
        await this.applyToVariants(productId, p.type, p.value, p.note);
      }
    }
  }

  async delete(id: string): Promise<string> {
    const existing = await this.repo.getById(id);

    for (const productId of existing.productIds) {
      await this.removeFromVariants(productId);
    }

    const deletedId = await this.repo.delete(id);
    return deletedId;
  }

  async deactivate(id: string): Promise<void> {
    const p = await this.repo.getById(id);
    await this.repo.update({ id, active: false });

    for (const productId of p.productIds) {
      await this.removeFromVariants(productId);
    }
  }

  async update(dto: UpdatePromotionRequestDto): Promise<PromotionResponseDto> {
    const existing = await this.repo.getById(dto.id);

    if (dto.productIds || dto.categoryId) {
      for (const productId of existing.productIds) {
        await this.removeFromVariants(productId);
      }
    }

    const updated = await this.repo.update(dto);
    const productIds = updated.productIds;

    if (updated.active) {
      if (isEffectiveNow(updated.startDate || null, updated.endDate || null)) {
        for (const productId of productIds) {
          await this.applyToVariants(
            productId,
            updated.type,
            updated.value,
            updated.note,
          );
        }
      } else {
        for (const productId of productIds) {
          await this.removeFromVariants(productId);
        }
      }
    } else {
      for (const productId of productIds) {
        await this.removeFromVariants(productId);
      }
    }
    return updated;
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
}
