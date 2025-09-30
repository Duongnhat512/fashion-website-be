import { OrderShippingAddress } from '../models/order_shipping_address.model';
import { CreateOrderShippingAddressRequestDto } from '../dtos/request/order/order_shipping_address.request';

export interface IOrderShippingAddressService {
  createOrderShippingAddress(
    orderShippingAddress: CreateOrderShippingAddressRequestDto,
  ): Promise<OrderShippingAddress>;
  updateOrderShippingAddress(
    orderShippingAddress: CreateOrderShippingAddressRequestDto,
  ): Promise<OrderShippingAddress>;
  deleteOrderShippingAddress(id: string): Promise<void>;
  getOrderShippingAddressByOrderId(
    orderId: string,
  ): Promise<OrderShippingAddress>;
}
