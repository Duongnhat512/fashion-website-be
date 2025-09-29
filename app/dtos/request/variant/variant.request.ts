import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Product } from '../../../models/product.model';
import { Color } from '../../../models/color.model';

export class VariantRequestDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsObject()
  color!: Color;

  @IsString()
  @IsNotEmpty()
  size!: string;

  @IsNumber()
  price!: number;

  @IsNumber()
  discountPrice!: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  stock!: number;

  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @IsBoolean()
  @IsOptional()
  onSales?: boolean;

  @IsString()
  @IsOptional()
  saleNote?: string;

  @IsOptional()
  product?: Product;
}
