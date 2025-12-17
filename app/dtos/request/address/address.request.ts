import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateAddressRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  fullName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  fullAddress!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  city!: string;

  @IsString()
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  district!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  ward!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressRequestDto {
  @IsUUID('4', { message: 'ID địa chỉ không hợp lệ' })
  id!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  fullAddress?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  district?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  ward?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SetDefaultAddressRequestDto {
  @IsUUID('4', { message: 'ID địa chỉ không hợp lệ' })
  id!: string;
}

