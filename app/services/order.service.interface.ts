import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../dtos/request/order/order.request';
import { OrderResponseDto } from '../dtos/response/order/order.response';
import OrderStatus from '../models/enum/order_status.enum';

export interface IOrderService {
  createOrder(order: CreateOrderRequestDto): Promise<OrderResponseDto>;
  updateOrder(order: UpdateOrderRequestDto): Promise<OrderResponseDto>;
  deleteOrder(id: string): Promise<string>;
  getOrderById(id: string): Promise<OrderResponseDto>;
  getAllOrders(page: number, limit: number): Promise<OrderResponseDto[]>;
  cancelOrder(orderId: string): Promise<void>;
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto>;
}
