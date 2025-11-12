import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Product } from '../../../models/product.model';
import { Color } from '../../../models/color.model';

export class VariantRequestDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'SKU không được để trống' })
  sku!: string;

  @IsObject()
  @IsNotEmpty({ message: 'Màu sắc không được để trống' })
  color!: Color;

  @IsString()
  @IsNotEmpty({ message: 'Kích thước không được để trống' })
  size!: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Giá không được để trống' })
  price!: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Giá khuyến mãi không được để trống' })
  discountPrice!: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  onSales?: boolean;

  @IsString()
  @IsOptional()
  saleNote?: string;

  @IsOptional()
  @IsObject()
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
