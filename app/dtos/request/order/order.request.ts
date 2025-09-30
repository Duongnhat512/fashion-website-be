import { OrderShippingAddress } from '../../../models/order_shipping_address.model';
import User from '../../../models/user.model';
import OrderStatus from '../../../models/enum/order_status.enum';
import { OrderItem } from '../../../models/order_item.model';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';

export class CreateOrderRequestDto {
  @IsObject()
  user!: User;

  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsNumber()
  subTotal!: number;

  @IsNumber()
  discount!: number;

  @IsNumber()
  totalAmount!: number;

  @IsNumber()
  shippingFee!: number;

  @IsOptional()
  @IsObject()
  shippingAddress?: OrderShippingAddress;

  @IsOptional()
  @IsArray()
  items?: OrderItem[];
}

export class UpdateOrderRequestDto {
  status!: OrderStatus;
  subTotal!: number;
  discount!: number;
  totalAmount!: number;
  shippingFee!: number;
  items!: OrderItem[];
  shippingAddress!: OrderShippingAddress;
}
