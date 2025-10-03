import { IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { Variant } from '../../../models/variant.model';
import { Warehouse } from '../../../models/warehouse.model';

export class CreateInventoryRequestDto {
  @IsObject()
  @IsNotEmpty()
  warehouse: Warehouse;

  @IsObject()
  @IsNotEmpty()
  variant: Variant;

  @IsNumber()
  @IsNotEmpty()
  onHand: number;

  @IsNumber()
  @IsNotEmpty()
  reserved: number;
}

export class UpdateInventoryRequestDto {
  @IsObject()
  @IsNotEmpty()
  warehouse!: Warehouse;

  @IsObject()
  @IsNotEmpty()
  variant: Variant;

  @IsNumber()
  @IsOptional()
  onHand: number;

  @IsNumber()
  @IsOptional()
  reserved: number;
}
