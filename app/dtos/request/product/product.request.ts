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
