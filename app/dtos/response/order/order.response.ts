import { OrderItem } from '../../../models/order_item.model';
import User from '../../../models/user.model';
import OrderStatus from '../../../models/enum/order_status.enum';
import { OrderShippingAddress } from '../../../models/order_shipping_address.model';

export class OrderResponseDto {
  id: string;
  user: User;
  status: OrderStatus;
  subTotal: number;
  discount: number;
  totalAmount: number;
  shippingFee: number;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  shippingAddress: OrderShippingAddress;
  isCOD: boolean;
}
