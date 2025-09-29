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
  private readonly addressRepository: Repository<OrderShippingAddress>;
  private readonly itemRepository: Repository<OrderItem>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.addressRepository = AppDataSource.getRepository(OrderShippingAddress);
    this.itemRepository = AppDataSource.getRepository(OrderItem);
  }

  async createOrder(order: CreateOrderRequestDto): Promise<OrderResponseDto> {
    const created = await this.orderRepository.save({
      status: order.status,
      subTotal: order.subTotal,
      discount: order.discount,
      totalAmount: order.totalAmount,
      shippingFee: order.shippingFee,
      user: { id: order.user.id } as any,
    });

    if (order.shippingAddress) {
      await this.addressRepository.save({
        ...order.shippingAddress,
        order: { id: created.id } as any,
      });
    }

    if (order.items?.length) {
      await Promise.all(
        order.items.map((i) =>
          this.itemRepository.save({
            order: { id: created.id } as any,
            product: i.product
              ? ({ id: (i.product as any).id } as any)
              : undefined,
            variant: i.variant
              ? ({ id: (i.variant as any).id } as any)
              : undefined,
            quantity: i.quantity,
            price: i.price,
          }),
        ),
      );
    }

    return this.getOrderById(created.id);
  }

  async updateOrder(order: UpdateOrderRequestDto): Promise<OrderResponseDto> {
    const updatedOrder = await this.orderRepository.save(order as any);
    return updatedOrder as OrderResponseDto;
  }

  async deleteOrder(id: string): Promise<void> {
    await this.orderRepository.delete(id);
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
