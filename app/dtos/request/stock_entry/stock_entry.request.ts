import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StockImportItemRequestDto } from './stock_entry_item.request';
import { StockEntryType } from '../../../models/enum/stock_entry_type,enum';
import { StockEntryStatus } from '../../../models/enum/stock_entry_status.enum';

export class ImportStockEntryRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(StockEntryType)
  type!: StockEntryType;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsEnum(StockEntryStatus)
  @IsOptional()
  status?: StockEntryStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockImportItemRequestDto)
  stockEntryItems!: StockImportItemRequestDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber()
  @IsNotEmpty()
  totalCost?: number;
}

export class FilterStockEntryRequestDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  status?: StockEntryStatus;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  warehouseName?: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  @IsOptional()
  sort?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;
}
