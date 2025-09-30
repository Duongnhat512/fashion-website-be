import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Category } from '../../../models/category.model';
import { Variant } from '../../../models/variant.model';
import { UpdateVariantRequestDto } from '../variant/variant.request';

export class ProductRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  shortDescription!: string;

  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsObject()
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
  variants?: Variant[];
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
