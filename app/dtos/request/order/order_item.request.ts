import { IsNumber, IsObject, IsString, IsUUID } from 'class-validator';
import { Product } from '../../../models/product.model';
import { Variant } from '../../../models/variant.model';
import { Order } from '../../../models/order.model';

export class CreateOrderItemRequestDto {
  @IsObject()
  order!: Order;

  @IsObject()
  product!: Product;

  @IsObject()
  variant!: Variant;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;
}
