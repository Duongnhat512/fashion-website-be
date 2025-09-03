import { VariantRequestDto } from '../variant/variant.request';

export class ProductRequestDto {
  name!: string;
  slug!: string;
  shortDescription!: string;
  imageUrl!: string;
  brand!: string;
  categoryId!: string;
  status!: string;
  tags!: string;
  variants!: VariantRequestDto[];
}
