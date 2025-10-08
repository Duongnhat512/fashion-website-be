import { OrderItem } from '../../models/order_item.model';
import { CreateOrderItemRequestDto } from '../../dtos/request/order/order_item.request';

export interface IOrderItemService {
  createOrderItem(orderItem: CreateOrderItemRequestDto): Promise<OrderItem>;
}
