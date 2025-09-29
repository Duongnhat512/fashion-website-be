import { OrderShippingAddress } from '../../../models/order_shipping_address.model';
import User from '../../../models/user.model';
import OrderStatus from '../../../models/enum/order_status.enum';
import { OrderItem } from '../../../models/order_item.model';

export class CreateOrderRequestDto {
  user!: User;
  status!: OrderStatus;
  subTotal!: number;
  discount!: number;
  totalAmount!: number;
  shippingFee!: number;
  items!: OrderItem[];
  shippingAddress!: OrderShippingAddress;
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
