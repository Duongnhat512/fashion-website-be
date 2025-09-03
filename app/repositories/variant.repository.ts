import { Repository } from 'typeorm';
import { Variant } from '../models/variant.model';
import { AppDataSource } from '../config/data-source';
import {
  PaginatedVariantsResponseDto,
  VariantResponseDto,
} from '../dtos/response/variant/variant.response';
import { VariantRequestDto } from '../dtos/request/variant/variant.request';

export class VariantRepository {
  private readonly variantRepository: Repository<Variant>;
  constructor() {
    this.variantRepository = AppDataSource.getRepository(Variant);
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
    return {
      variants: variants,
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
    return {
      ...variant,
    };
  }

  async create(variant: VariantRequestDto): Promise<VariantResponseDto> {
    const newVariant = this.variantRepository.create(variant);
    const savedVariant = await this.variantRepository.save(newVariant);
    return {
      ...savedVariant,
    };
  }

  async update(variant: VariantRequestDto): Promise<VariantResponseDto> {
    const updatedVariant = await this.variantRepository.save({
      ...variant,
    });
    return {
      ...updatedVariant,
    };
  }

  async delete(id: string): Promise<void> {
    await this.variantRepository.delete(id);
  }
}
