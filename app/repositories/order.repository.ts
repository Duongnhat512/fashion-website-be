import { Repository } from 'typeorm';
import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../dtos/request/order/order.request';
import { OrderResponseDto } from '../dtos/response/order/order.response';
import { Order } from '../models/order.model';
import { AppDataSource } from '../config/data_source';
import { OrderShippingAddress } from '../models/order_shipping_address.model';
import { OrderItem } from '../models/order_item.model';

export class OrderRepository {
  private readonly orderRepository: Repository<Order>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  async createOrder(order: CreateOrderRequestDto): Promise<OrderResponseDto> {
    const created = await this.orderRepository.save({
      ...order,
    });

    return this.getOrderById(created.id);
  }

  async updateOrder(order: UpdateOrderRequestDto): Promise<OrderResponseDto> {
    const updatedOrder = await this.orderRepository.save({
      ...order,
    });
    return updatedOrder as OrderResponseDto;
  }

  async deleteOrder(id: string): Promise<string> {
    await this.orderRepository.delete(id);
    return id;
  }

  async getOrderById(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        user: true,
        items: {
          product: true,
          variant: {
            color: true,
          },
        },
        shippingAddress: true,
      },
    });
    return order as unknown as OrderResponseDto;
  }

  async getAllOrders(
    page: number = 1,
    limit: number = 10,
  ): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        user: true,
        items: {
          product: true,
          variant: {
            color: true,
          },
        },
        shippingAddress: true,
      },
      order: { createdAt: 'DESC' },
    });
    return orders as unknown as OrderResponseDto[];
  }
}
