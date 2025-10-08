import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category } from '../../../models/category.model';

export class CreateCategoryRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  iconUrl!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsObject()
  @IsOptional()
  parent?: Category;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  autoGenSlug?: boolean;

  @IsBoolean()
  @IsOptional()
  autoGenSeoTitle?: boolean;

  @IsBoolean()
  @IsOptional()
  autoGenSeoDescription?: boolean;
}

export class UpdateCategoryRequestDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  iconUrl!: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsObject()
  @IsOptional()
  parent?: Category;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  autoGenSlug?: boolean;

  @IsBoolean()
  @IsOptional()
  autoGenSeoTitle?: boolean;

  @IsBoolean()
  @IsOptional()
  autoGenSeoDescription?: boolean;
}
