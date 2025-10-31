import { DataSource } from 'typeorm';
import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../../../dtos/request/order/order.request';
import { OrderResponseDto } from '../../../dtos/response/order/order.response';
import { OrderRepository } from '../../../repositories/order.repository';
import { IOrderService } from '../order.service.interface';
import { AppDataSource } from '../../../config/data_source';
import OrderStatus from '../../../models/enum/order_status.enum';
import InventoryRepository from '../../../repositories/inventory.repository';
import { OrderItemRepository } from '../../../repositories/order_item.repository';

export class OrderService implements IOrderService {
  private readonly orderRepository: OrderRepository;
  private readonly dataSource: DataSource;
  private readonly inventoryRepository: InventoryRepository;
  private readonly orderItemRepository: OrderItemRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.dataSource = AppDataSource;
    this.inventoryRepository = new InventoryRepository();
    this.orderItemRepository = new OrderItemRepository();
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
    try {
      return await this.dataSource.transaction(async (m) => {
        const warehouseAllocations: any[] = [];
        for (const item of order.items || []) {
          const candidates =
            await this.inventoryRepository.getInventoryByVariantId(
              item.variant.id,
            );

          let allocated = false;
          for (const c of candidates) {
            const inv = await this.inventoryRepository.getInventoryById(c.id);
            if (!inv) continue;

            const available = inv.onHand - inv.reserved;
            if (available >= item.quantity) {
              warehouseAllocations.push({
                item,
                inventory: inv,
                warehouse: inv.warehouse,
              });
              allocated = true;
              break;
            }
          }
          if (!allocated) throw new Error('Không đủ hàng cho sản phẩm.');
        }

        const subTotal = order.items.reduce((sum, item) => {
          return sum + item.rate * item.quantity;
        }, 0);

        const discountAmount = subTotal * (order.discount / 100);
        const totalAmount = subTotal - discountAmount + order.shippingFee;

        order.subTotal = subTotal;
        order.totalAmount = totalAmount;

        if (order.isCOD) {
          order.status = OrderStatus.PENDING;
        }

        const createdOrder = await this.orderRepository.createOrder({
          ...order,
          items: order.items?.map((it, idx) => ({
            ...it,
            warehouse: warehouseAllocations[idx].warehouse,
          })),
        });

        for (const allocation of warehouseAllocations) {
          const inv = await this.inventoryRepository.getInventoryById(
            allocation.inventory.id,
          );
          if (!inv) throw new Error('Inventory not found');

          inv.reserved += allocation.item.quantity;
          await this.inventoryRepository.updateInventory(inv);
        }

        return createdOrder;
      });
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.dataSource.transaction(async (m) => {
      const order = await this.orderRepository.getOrderById(orderId);
      if (!order) throw new Error('Không tìm thấy đơn hàng');

      const canCancel =
        order.status === OrderStatus.UNPAID ||
        order.status === OrderStatus.PENDING;
      if (!canCancel) {
        throw new Error('Trạng thái đơn hiện tại không cho phép hủy');
      }

      const items = await this.orderItemRepository.getOrderItemsByOrderId(
        orderId,
      );

      for (const item of items) {
        const inv =
          await this.inventoryRepository.getInventoryByVariantIdAndWarehouseId(
            item.variant.id,
            item.warehouse.id,
          );
        if (!inv) continue;

        if (inv.reserved < item.quantity) {
          throw new Error('Reserved dưới 0 khi hủy đơn');
        }

        inv.reserved -= item.quantity;
        await this.inventoryRepository.updateInventory(inv);
      }

      order.status = OrderStatus.CANCELLED;
      await this.orderRepository.updateOrder(order);
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    order.status = status;
    await this.orderRepository.updateOrder(order);
    return order;
  }
  
  async getOrdersByUserId(userId: string): Promise<OrderResponseDto[]> {
    return this.orderRepository.getOrdersByUserId(userId);
  }
}
