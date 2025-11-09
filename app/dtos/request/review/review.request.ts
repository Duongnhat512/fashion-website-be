import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewRequestDto {
  @IsUUID()
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  productId!: string;

  @IsInt()
  @Min(1, { message: 'Rating phải từ 1 đến 5' })
  @Max(5, { message: 'Rating phải từ 1 đến 5' })
  @IsNotEmpty({ message: 'Rating không được để trống' })
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateReviewRequestDto {
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
