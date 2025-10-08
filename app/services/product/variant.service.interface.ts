import { VariantRequestDto } from '../../dtos/request/variant/variant.request';
import {
  PaginatedVariantsResponseDto,
  VariantResponseDto,
} from '../../dtos/response/variant/variant.response';

export interface IVariantService {
  createVariant(variant: VariantRequestDto): Promise<VariantResponseDto>;
  updateVariant(variant: VariantRequestDto): Promise<VariantResponseDto>;
  deleteVariant(id: string): Promise<void>;
  getVariantById(id: string): Promise<VariantResponseDto | null>;
  getAllVariants(
    page: number,
    limit: number,
  ): Promise<PaginatedVariantsResponseDto>;
}
