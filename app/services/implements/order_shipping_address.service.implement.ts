import { IOrderShippingAddressService } from '../order_shipping_address.service.interface';
import { OrderShippingAddressRepository } from '../../repositories/order_shipping_address.repository';
import { CreateOrderShippingAddressRequestDto } from '../../dtos/request/order/order_shipping_address.request';
import { OrderShippingAddress } from '../../models/order_shipping_address.model';

export class OrderShippingAddressService
  implements IOrderShippingAddressService
{
  private readonly orderShippingAddressRepository: OrderShippingAddressRepository;

  constructor() {
    this.orderShippingAddressRepository = new OrderShippingAddressRepository();
  }

  async createOrderShippingAddress(
    orderShippingAddress: CreateOrderShippingAddressRequestDto,
  ): Promise<OrderShippingAddress> {
    return this.orderShippingAddressRepository.create(orderShippingAddress);
  }

  async updateOrderShippingAddress(
    orderShippingAddress: CreateOrderShippingAddressRequestDto,
  ): Promise<OrderShippingAddress> {
    return this.orderShippingAddressRepository.update(orderShippingAddress);
  }

  async deleteOrderShippingAddress(id: string): Promise<void> {
    return this.orderShippingAddressRepository.delete(id);
  }

  async getOrderShippingAddressByOrderId(
    orderId: string,
  ): Promise<OrderShippingAddress> {
    const orderShippingAddress =
      await this.orderShippingAddressRepository.getByOrderId(orderId);
    if (!orderShippingAddress) {
      throw new Error('Order shipping address not found');
    }
    return orderShippingAddress;
  }
}
