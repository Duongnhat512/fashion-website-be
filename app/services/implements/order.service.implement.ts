import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../../dtos/request/order/order.request';
import { OrderResponseDto } from '../../dtos/response/order/order.response';
import { OrderRepository } from '../../repositories/order.repository';
import { IOrderService } from '../order.service.interface';

export class OrderService implements IOrderService {
  private readonly orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async updateOrder(order: UpdateOrderRequestDto): Promise<OrderResponseDto> {
    return this.orderRepository.updateOrder(order);
  }

  async deleteOrder(id: string): Promise<string> {
    await this.orderRepository.deleteOrder(id);
    return id;
  }

  async getOrderById(id: string): Promise<OrderResponseDto> {
    return this.orderRepository.getOrderById(id);
  }

  async getAllOrders(page: number, limit: number): Promise<OrderResponseDto[]> {
    return this.orderRepository.getAllOrders(page, limit);
  }

  async createOrder(order: CreateOrderRequestDto): Promise<OrderResponseDto> {
    return this.orderRepository.createOrder(order);
  }
}
