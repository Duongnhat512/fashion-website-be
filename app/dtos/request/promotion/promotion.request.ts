import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsArray,
  ArrayMinSize,
  Max,
  Min,
} from 'class-validator';
import PromotionType from '../../../models/enum/promotional_type.enum';
import PromotionStatus from '../../../models/enum/promotion.enum';

export class CreatePromotionRequestDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 sản phẩm' })
  productIds?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsNotEmpty()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @IsOptional()
  note?: string;

  @IsOptional()
  name?: string;
}

export class UpdatePromotionRequestDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  productIds?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  note?: string;

  @IsOptional()
  name?: string;
}
