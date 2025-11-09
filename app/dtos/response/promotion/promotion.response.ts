import PromotionType from '../../../models/enum/promotional_type.enum';

export type PromotionResponseDto = {
  id: string;
  productIds: string[];
  categoryId?: string | null;
  categoryName?: string | null;
  type: PromotionType;
  value: number;
  name?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  active: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};
