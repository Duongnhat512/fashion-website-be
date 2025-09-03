import { PaginationResponseDto } from '../pagination.response.dto';
import { VariantResponseDto } from '../variant/variant.response';

export class ProductResponseDto {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  imageUrl: string;
  brand: string;
  categoryId: string;
  status: string;
  tags: string;
  ratingAverage: number;
  ratingCount: number;
  variants: VariantResponseDto[];
}

export class PaginatedProductsResponseDto {
  products: ProductResponseDto[];
  pagination: PaginationResponseDto;
}
