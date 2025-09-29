import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../dtos/request/order/order.request';
import { OrderResponseDto } from '../dtos/response/order/order.response';

export interface IOrderService {
  createOrder(order: CreateOrderRequestDto): Promise<OrderResponseDto>;
  updateOrder(order: UpdateOrderRequestDto): Promise<OrderResponseDto>;
  deleteOrder(id: string): Promise<void>;
  getOrderById(id: string): Promise<OrderResponseDto>;
  getAllOrders(page: number, limit: number): Promise<OrderResponseDto[]>;
}
