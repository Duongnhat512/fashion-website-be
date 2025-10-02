import { IsNumber, IsObject, IsString, IsUUID } from 'class-validator';
import { Product } from '../../../models/product.model';
import { Variant } from '../../../models/variant.model';

export class CreateOrderItemRequestDto {
  @IsObject()
  product!: Product;

  @IsObject()
  variant!: Variant;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;
}
