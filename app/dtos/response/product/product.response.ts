import { Variant } from '../../../models/variant.model';
import { PaginationResponseDto } from '../pagination.response.dto';

export class ProductResponseDto {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  imageUrl: string;
  brand: string;
  categoryId?: string;
  status: string;
  tags: string;
  ratingAverage: number;
  ratingCount: number;
  variants: Variant[];
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedProductsResponseDto {
  products: ProductResponseDto[];
  pagination: PaginationResponseDto;
}
