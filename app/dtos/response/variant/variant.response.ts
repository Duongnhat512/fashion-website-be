import { ColorResponseDto } from '../color/color.response';

export class VariantResponseDto {
  id: string;
  sku: string;
  color: ColorResponseDto;
  size: string;
  price: number;
  discountPrice: number;
  stock: number;
  imageUrl: string;
  onSales: boolean;
  saleNote: string;
}
