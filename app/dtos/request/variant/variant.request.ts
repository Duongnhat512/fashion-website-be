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

export class UpdateVariantRequestDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsObject()
  @IsOptional()
  color?: Color;

  @IsString()
  @IsOptional()
  size?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  discountPrice?: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  onSales?: boolean;

  @IsString()
  @IsOptional()
  saleNote?: string;
}
