import PromotionType from '../../../models/enum/promotional_type.enum';
import PromotionStatus from '../../../models/enum/promotion.enum';
import { Product } from '../../../models/product.model';

export type PromotionResponseDto = {
  id: string;
  products: Product[];
  categoryId?: string | null;
  categoryName?: string | null;
  type: PromotionType;
  value: number;
  name?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status: PromotionStatus; // NEW
  active: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};
