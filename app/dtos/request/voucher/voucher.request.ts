import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateVoucherRequestDto {
  @IsString({ message: 'Mã voucher phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã voucher không được để trống' })
  code!: string;

  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @IsNumber({}, { message: 'Giá trị giảm giá phải là số' })
  @Min(0, { message: 'Giá trị giảm giá phải lớn hơn hoặc bằng 0' })
  @Max(100, { message: 'Giá trị giảm giá tối đa là 100%' })
  discountPercentage!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá trị giảm tối đa phải là số' })
  maxDiscountValue?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá trị tối thiểu đơn hàng phải là số' })
  @Min(0, { message: 'Giá trị tối thiểu đơn hàng không âm' })
  minOrderValue?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Số lần sử dụng tối đa phải là số' })
  @Min(1, { message: 'Số lần sử dụng tối đa phải lớn hơn 0' })
  usageLimit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Số lần sử dụng trên mỗi người phải là số' })
  @Min(1, { message: 'Số lần sử dụng trên mỗi người phải lớn hơn 0' })
  usageLimitPerUser?: number;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái phải là boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isStackable phải là boolean' })
  isStackable?: boolean;

  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate!: string;

  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate!: string;
}

export class UpdateVoucherRequestDto {
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Giá trị giảm giá phải là số' })
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá trị giảm tối đa phải là số' })
  maxDiscountValue?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giá trị tối thiểu đơn hàng phải là số' })
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Số lần sử dụng tối đa phải là số' })
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Số lần sử dụng trên mỗi người phải là số' })
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái phải là boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isStackable phải là boolean' })
  isStackable?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate?: string;
}

export class VoucherQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
