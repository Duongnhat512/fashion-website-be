import { DataSource } from 'typeorm';
import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../../../dtos/request/order/order.request';
import {
  OrderResponseDto,
  PaginatedOrdersResponseDto,
} from '../../../dtos/response/order/order.response';
import { OrderRepository } from '../../../repositories/order.repository';
import { IOrderService } from '../order.service.interface';
import { AppDataSource } from '../../../config/data_source';
import OrderStatus from '../../../models/enum/order_status.enum';
import InventoryRepository from '../../../repositories/inventory.repository';
import { OrderItemRepository } from '../../../repositories/order_item.repository';
import CartItemRepository from '../../../repositories/cart_item.repository';
import CartRepository from '../../../repositories/cart.repository';
import CartItemRequestDto from '../../../dtos/request/cart/cart_item.request';
import { IProductCacheService } from '../../product/product_cache.service.interface';
import { ProductCacheService } from '../../product/implements/product_cache.service.implement';
import { RecommendationService } from '../../recommendation/implements/recommendation.service.implement';
import { IVoucherService } from '../../voucher/voucher.service.interface';
import { VoucherService } from '../../voucher/implements/voucher.service.implement';
import { Voucher } from '../../../models/voucher.model';
import { IProductService } from '../../product/product.service.interface';
import { ProductService } from '../../product/implements/product.service.implement';
import { AddressRepository } from '../../../repositories/address.repository';
import logger from '../../../utils/logger';

export class OrderService implements IOrderService {
  private readonly orderRepository: OrderRepository;
  private readonly dataSource: DataSource;
  private readonly inventoryRepository: InventoryRepository;
  private readonly orderItemRepository: OrderItemRepository;
  private readonly cartRepository: CartRepository;
  private readonly cartItemRepository: CartItemRepository;
  private readonly productCacheService: IProductCacheService;
  private readonly recommendationService: RecommendationService;
  private readonly voucherService: IVoucherService;
  private readonly productService: IProductService;
  private readonly addressRepository: AddressRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.dataSource = AppDataSource;
    this.inventoryRepository = new InventoryRepository();
    this.orderItemRepository = new OrderItemRepository();
    this.cartRepository = new CartRepository();
    this.cartItemRepository = new CartItemRepository();
    this.productCacheService = new ProductCacheService();
    this.recommendationService = new RecommendationService();
    this.voucherService = new VoucherService();
    this.productService = new ProductService();
    this.addressRepository = new AddressRepository();
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

  async getAllOrders(
    page: number,
    limit: number,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.orderRepository.getAllOrders(page, limit);
  }

  async createOrder(order: CreateOrderRequestDto): Promise<OrderResponseDto> {
    try {
      return await this.dataSource.transaction(async (m) => {
        // Validate and get address
        if (!order.addressId) {
          throw new Error('Vui lòng chọn địa chỉ giao hàng');
        }

        const address = await this.addressRepository.findById(order.addressId);
        if (!address) {
          throw new Error('Không tìm thấy địa chỉ');
        }

        // Verify address belongs to user
        if (address.user.id !== order.user.id) {
          throw new Error('Địa chỉ không thuộc về người dùng này');
        }

        order.address = address;

        const warehouseAllocations: any[] = [];

        if (!order.items || order.items.length === 0) {
          throw new Error('Đơn hàng phải có ít nhất 1 sản phẩm');
        }
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

        order.shippingFee = order.shippingFee ?? 0;
        order.discount = order.discount ?? 0;

        const subTotal = order.items.reduce((sum, item) => {
          return sum + item.rate * item.quantity;
        }, 0);

        order.subTotal = subTotal;

        let appliedVoucher: Voucher | null = null;
        let discountPercentage = order.discount ?? 0;

        if (order.voucherCode && order.user?.id) {
          const voucher = await this.voucherService.validateVoucherForOrder(
            order.voucherCode,
            order.user.id,
            subTotal,
          );
          appliedVoucher = voucher;
          discountPercentage = voucher.discountPercentage;
          order.voucher = voucher;
          order.voucherCode = voucher.code;
        }

        const discountAmount = subTotal * (discountPercentage / 100);
        const cappedDiscount =
          appliedVoucher?.maxDiscountValue !== undefined &&
          appliedVoucher?.maxDiscountValue !== null
            ? Math.min(discountAmount, appliedVoucher.maxDiscountValue)
            : discountAmount;

        const totalAmount = subTotal - cappedDiscount + order.shippingFee;

        order.discount = discountPercentage;
        order.totalAmount = Math.max(totalAmount, 0);

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
          if (!inv) throw new Error('Không tìm thấy khoản nhập kho');

          inv.reserved += allocation.item.quantity;
          await this.inventoryRepository.updateInventory(inv);
        }

        const cart = await this.cartRepository.findCartByUserId(order.user.id);

        if (cart && order.items?.length) {
          for (const it of order.items) {
            const existing = await this.cartItemRepository.getCartItem({
              cartId: cart.id,
              productId: it.product.id,
              variantId: it.variant.id,
              quantity: it.quantity,
            } as CartItemRequestDto);

            if (!existing) continue;

            const remaining = existing.quantity - it.quantity;

            if (remaining > 0) {
              await this.cartItemRepository.updateCartItem({
                id: existing.id,
                cartId: cart.id,
                productId: it.product.id,
                variantId: it.variant.id,
                quantity: remaining,
              } as CartItemRequestDto);
            } else {
              await this.cartItemRepository.removeCartItem(existing.id);
            }
          }
        }

        const updatedProductIds = new Set<string>();
        for (const item of order.items) {
          if (item.product.id && !updatedProductIds.has(item.product.id)) {
            const product = await this.productCacheService.getProduct(
              item.product.id,
            );
            if (product) {
              await this.productCacheService.indexProduct(product);
              updatedProductIds.add(item.product.id);
            }
          }
        }

        // Track user purchase for recommendation (async, non-blocking)
        // Update user preference vector based on purchased products
        if (order.user && order.user.id) {
          const userId = parseInt(order.user.id);

          // Track each purchased product asynchronously
          for (const item of order.items) {
            if (item.product.id) {
              const embedding = await this.productService.getProductEmbedding(
                item.product.id,
              );
              if (embedding) {
                await this.recommendationService.updateUserPreference(
                  userId,
                  embedding,
                  0.1,
                );
              }
            }
          }
        }

        if (appliedVoucher && order.user?.id) {
          await this.voucherService.markVoucherAsUsed(
            appliedVoucher.id,
            order.user.id,
          );
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

      const updatedProductIds = new Set<string>();

      for (const item of items) {
        if (updatedProductIds.has(item.product.id)) continue;
        const product = await this.productCacheService.getProduct(
          item.product.id,
        );
        if (product) {
          await this.productCacheService.indexProduct(product);
        }
        updatedProductIds.add(item.product.id);
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
  
    const priority = this.getOrderStatusPriority(status);
    const currentPriority = this.getOrderStatusPriority(order.status);
  
    if (priority < currentPriority || priority - currentPriority != 1) {
      throw new Error('Trạng thái đơn hiện tại không cho phép cập nhật');
    }
  
    if (
      (status === OrderStatus.DELIVERED || status === OrderStatus.COMPLETED) &&
      (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED)
    ) {
      const items = await this.orderItemRepository.getOrderItemsByOrderId(orderId);
  
      for (const item of items) {
        const inv = await this.inventoryRepository.getInventoryByVariantIdAndWarehouseId(
          item.variant.id,
          item.warehouse.id,
        );
  
        if (!inv) {
          logger.warn(
            `Không tìm thấy inventory cho variant ${item.variant.id} tại warehouse ${item.warehouse.id}`,
          );
          continue;
        }
  
        if (inv.reserved < item.quantity) {
          throw new Error(
            `Reserved không đủ để trừ kho cho variant ${item.variant.id}`,
          );
        }
  
        inv.reserved -= item.quantity;
        inv.onHand -= item.quantity;
  
        if (inv.onHand < 0) {
          throw new Error(
            `onHand không thể âm cho variant ${item.variant.id}`,
          );
        }
  
        await this.inventoryRepository.updateInventory(inv);
      }
  
      const updatedProductIds = new Set<string>();
      for (const item of items) {
        if (!updatedProductIds.has(item.product.id)) {
          const product = await this.productCacheService.getProduct(item.product.id);
          if (product) {
            await this.productCacheService.indexProduct(product);
          }
          updatedProductIds.add(item.product.id);
        }
      }
    }
  
    order.status = status;
    await this.orderRepository.updateOrder(order);
    return order;
  }

  async getOrdersByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.orderRepository.getOrdersByUserId(userId, page, limit);
  }

  getOrderStatusPriority(status: OrderStatus): number {
    switch (status) {
      case OrderStatus.UNPAID:
        return 0;
      case OrderStatus.PENDING:
        return 1;
      case OrderStatus.READY_TO_SHIP:
        return 2;
      case OrderStatus.SHIPPING:
        return 3;
      case OrderStatus.DELIVERED:
        return 4;
      case OrderStatus.COMPLETED:
        return 5;
      default:
        return 0;
    }
  }
}
