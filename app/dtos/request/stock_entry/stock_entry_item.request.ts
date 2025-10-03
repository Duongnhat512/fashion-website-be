import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class InventoryRequestDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  id!: string;
}

export class StockImportItemRequestDto {
  @Type(() => InventoryRequestDto)
  @ValidateNested()
  inventory!: InventoryRequestDto;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  unitCost!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
