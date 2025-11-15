import { Repository } from 'typeorm';
import { OrderItem } from '../models/order_item.model';
import { AppDataSource } from '../config/data_source';
import { CreateOrderItemRequestDto } from '../dtos/request/order/order_item.request';

export class OrderItemRepository {
  private readonly orderItemRepository: Repository<OrderItem>;

  constructor() {
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
  }

  async createOrderItem(
    orderItem: CreateOrderItemRequestDto,
  ): Promise<OrderItem> {
    const newOrderItem = await this.orderItemRepository.save({
      ...orderItem,
    });
    return newOrderItem;
  }

  async getOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      where: { order: { id: orderId } },
      relations: ['variant', 'warehouse', 'product'],
    });
  }

  async getOrderItemsByVariantIdAndWarehouseId(
    variantId: string,
    warehouseId: string,
  ): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      where: { variant: { id: variantId }, warehouse: { id: warehouseId } },
      relations: ['variant', 'warehouse'],
    });
  }
}
