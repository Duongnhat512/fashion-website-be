import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Category } from '../../../models/category.model';
import {
  UpdateVariantRequestDto,
  VariantRequestDto,
} from '../variant/variant.request';

export class ProductRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống' })
  slug!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả ngắn không được để trống' })
  shortDescription!: string;

  @IsString()
  @IsNotEmpty({ message: 'Ảnh sản phẩm không được để trống' })
  imageUrl!: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsObject()
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  category!: Category;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  variants?: VariantRequestDto[];
}

export class UpdateProductRequestDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsOptional()
  @IsObject()
  category?: Category;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  variants?: UpdateVariantRequestDto[];
}
