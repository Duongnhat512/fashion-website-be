import { IVariantService } from '../variant.service.interface';
import { VariantRepository } from '../../../repositories/variant.repository';
import { VariantRequestDto } from '../../../dtos/request/variant/variant.request';
import {
  PaginatedVariantsResponseDto,
  VariantResponseDto,
} from '../../../dtos/response/variant/variant.response';

export class VariantService implements IVariantService {
  private readonly variantRepository: VariantRepository;
  constructor() {
    this.variantRepository = new VariantRepository();
  }

  async deleteVariant(id: string): Promise<void> {
    await this.variantRepository.delete(id);
  }

  createVariant(variant: VariantRequestDto): Promise<VariantResponseDto> {
    return this.variantRepository.create(variant);
  }

  updateVariant(variant: VariantRequestDto): Promise<VariantResponseDto> {
    return this.variantRepository.update(variant);
  }

  async getVariantById(id: string): Promise<VariantResponseDto | null> {
    const variant = await this.variantRepository.findById(id);
    if (!variant) {
      return null;
    }
    return variant;
  }

  getAllVariants(
    page: number,
    limit: number,
  ): Promise<PaginatedVariantsResponseDto> {
    return this.variantRepository.findAll(page, limit);
  }

  async getVariantStock(variantId: string): Promise<number> {
    return await this.variantRepository.calculateStock(variantId);
  }
}
