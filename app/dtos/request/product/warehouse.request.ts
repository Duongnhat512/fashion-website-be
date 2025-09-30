import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWarehouseRequest {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  status!: string;
}

export class UpdateWarehouseRequest {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  name?: string;

  @IsString()
  code?: string;

  @IsString()
  address?: string;

  @IsString()
  status?: string;
}
