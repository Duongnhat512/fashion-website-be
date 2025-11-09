import {
  CreatePromotionRequestDto,
  UpdatePromotionRequestDto,
} from '../../dtos/request/promotion/promotion.request';
import { PromotionResponseDto } from '../../dtos/response/promotion/promotion.response';

export interface IPromotionService {
  create(dto: CreatePromotionRequestDto): Promise<PromotionResponseDto>;
  update(dto: UpdatePromotionRequestDto): Promise<PromotionResponseDto>;
  delete(id: string): Promise<string>;
  getById(id: string): Promise<PromotionResponseDto>;
  getPromotions(params: {
    page?: number;
    limit?: number;
    productId?: string;
    active?: boolean;
  }): Promise<{
    data: PromotionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
}
