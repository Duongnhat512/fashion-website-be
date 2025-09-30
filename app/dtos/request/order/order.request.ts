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
  IsString,
  ValidateNested,
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
  @ValidateNested()
  shippingAddress?: OrderShippingAddress;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  items?: OrderItem[];
}

export class UpdateOrderRequestDto {
  @IsOptional()
  @IsString()
  id!: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsNumber()
  subTotal?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  items?: OrderItem[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  shippingAddress?: OrderShippingAddress;
}
