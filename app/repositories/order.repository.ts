import { Repository } from 'typeorm';
import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../dtos/request/order/order.request';
import {
  OrderResponseDto,
  PaginatedOrdersResponseDto,
} from '../dtos/response/order/order.response';
import { Order } from '../models/order.model';
import { AppDataSource } from '../config/data_source';

export class OrderRepository {
  private readonly orderRepository: Repository<Order>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
  }

  async createOrder(order: CreateOrderRequestDto): Promise<OrderResponseDto> {
    const orderEntity = this.orderRepository.create(order);
    const created = await this.orderRepository.save(orderEntity);

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
        voucher: true,
      },
    });
    return order as unknown as OrderResponseDto;
  }

  async getAllOrders(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedOrdersResponseDto> {
    const [orders, total] = await this.orderRepository.findAndCount({
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
        voucher: true,
      },
      order: { createdAt: 'DESC' },
    });
    return {
      orders: orders.map((order) => order as unknown as OrderResponseDto),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getOrdersByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedOrdersResponseDto> {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { user: { id: userId } },
      relations: {
        user: true,
        items: {
          product: true,
          variant: {
            color: true,
          },
        },
        shippingAddress: true,
        voucher: true,
      },
      order: { createdAt: 'DESC' },
    });
    return {
      orders: orders.map((order) => order as unknown as OrderResponseDto),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
