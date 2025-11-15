import { ColorResponseDto } from '../color/color.response';
import { ProductResponseDto } from '../product/product.response';
import { PaginationResponseDto } from '../pagination.response.dto';

export class VariantResponseDto {
  id: string;
  sku: string;
  product?: ProductResponseDto;
  color: ColorResponseDto;
  size: string;
  price: number;
  discountPrice: number;
  stock: number;
  imageUrl: string;
  onSales: boolean;
  saleNote: string;
}

export class PaginatedVariantsResponseDto {
  variants: VariantResponseDto[];
  pagination: PaginationResponseDto;
}
