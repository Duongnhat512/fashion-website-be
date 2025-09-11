import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  MinLength,
} from 'class-validator';
import Role from '../../../models/enum/role.enum';

export class CreateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  fullname!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsDateString()
  @IsOptional()
  dob?: Date;

  @IsString()
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  avt?: string;

  @IsOptional()
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsString()
  verificationToken: string;
}

export class LoginRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
