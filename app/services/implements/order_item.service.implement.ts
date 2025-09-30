import { IOrderItemService } from '../order_item.service.interface';
import { OrderItemRepository } from '../../repositories/order_item.repository';
import { CreateOrderItemRequestDto } from '../../dtos/request/order/order_item.request';
import { OrderItem } from '../../models/order_item.model';

export class OrderItemService implements IOrderItemService {
  private readonly orderItemRepository: OrderItemRepository;
  constructor() {
    this.orderItemRepository = new OrderItemRepository();
  }

  async createOrderItem(
    orderItem: CreateOrderItemRequestDto,
  ): Promise<OrderItem> {
    return this.orderItemRepository.createOrderItem(orderItem);
  }
}
