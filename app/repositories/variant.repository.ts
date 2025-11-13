import { Repository } from 'typeorm';
import { Variant } from '../models/variant.model';
import { AppDataSource } from '../config/data_source';
import {
  PaginatedVariantsResponseDto,
  VariantResponseDto,
} from '../dtos/response/variant/variant.response';
import { VariantRequestDto } from '../dtos/request/variant/variant.request';
import InventoryRepository from './inventory.repository';

export class VariantRepository {
  private readonly variantRepository: Repository<Variant>;
  private readonly inventoryRepository: InventoryRepository;

  constructor() {
    this.variantRepository = AppDataSource.getRepository(Variant);
    this.inventoryRepository = new InventoryRepository();
  }

  async calculateStock(variantId: string): Promise<number> {
    const inventories = await this.inventoryRepository.getInventoryByVariantId(
      variantId,
    );
    return inventories.reduce(
      (total, inv) => total + (inv.onHand - inv.reserved),
      0,
    );
  }

  private async toDto(variant: Variant): Promise<VariantResponseDto> {
    const stock = await this.calculateStock(variant.id);
    return {
      id: variant.id,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      discountPrice: variant.discountPrice,
      stock: stock,
      imageUrl: variant.imageUrl,
      onSales: variant.onSales,
      saleNote: variant.saleNote,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedVariantsResponseDto> {
    const [variants, total] = await this.variantRepository.findAndCount({
      relations: {
        color: true,
      },
    });

    const variantDtos = await Promise.all(variants.map((v) => this.toDto(v)));

    return {
      variants: variantDtos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  async findById(id: string): Promise<VariantResponseDto | null> {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: {
        color: true,
      },
    });
    if (!variant) {
      return null;
    }
    return this.toDto(variant);
  }

  async create(variant: VariantRequestDto): Promise<VariantResponseDto> {
    const newVariant = this.variantRepository.create(variant);
    const savedVariant = await this.variantRepository.save(newVariant);
    return this.toDto(savedVariant);
  }

  async update(variant: VariantRequestDto): Promise<VariantResponseDto> {
    const updatedVariant = await this.variantRepository.save({
      ...variant,
    });
    return this.toDto(updatedVariant);
  }

  async delete(id: string): Promise<void> {
    await this.variantRepository.delete(id);
  }
}
