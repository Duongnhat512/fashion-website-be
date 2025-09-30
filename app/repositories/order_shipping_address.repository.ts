import { Repository } from 'typeorm';
import { OrderShippingAddress } from '../models/order_shipping_address.model';
import { AppDataSource } from '../config/data_source';
import { CreateOrderShippingAddressRequestDto } from '../dtos/request/order/order_shipping_address.request';

export class OrderShippingAddressRepository {
  private readonly orderShippingAddressRepository: Repository<OrderShippingAddress>;

  constructor() {
    this.orderShippingAddressRepository =
      AppDataSource.getRepository(OrderShippingAddress);
  }

  async create(
    orderShippingAddress: CreateOrderShippingAddressRequestDto,
  ): Promise<OrderShippingAddress> {
    const newOrderShippingAddress =
      await this.orderShippingAddressRepository.save({
        ...orderShippingAddress,
      });
    return newOrderShippingAddress;
  }

  async update(
    orderShippingAddress: CreateOrderShippingAddressRequestDto,
  ): Promise<OrderShippingAddress> {
    const updatedOrderShippingAddress =
      await this.orderShippingAddressRepository.save({
        ...orderShippingAddress,
      });
    return updatedOrderShippingAddress;
  }

  async delete(id: string): Promise<void> {
    await this.orderShippingAddressRepository.delete(id);
  }

  async getByOrderId(orderId: string): Promise<OrderShippingAddress | null> {
    const orderShippingAddress =
      await this.orderShippingAddressRepository.findOne({
        where: { order: { id: orderId } },
      });
    return orderShippingAddress;
  }
}
