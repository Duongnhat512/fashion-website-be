import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { Order } from '../models/order.model';
import { OrderItem } from '../models/order_item.model';
import { StockEntry } from '../models/stock_entry.model';
import { StockEntryItem } from '../models/stock_entry_item.model';
import OrderStatus from '../models/enum/order_status.enum';
import { StockEntryStatus } from '../models/enum/stock_entry_status.enum';
import { StockEntryType } from '../models/enum/stock_entry_type,enum';
import { PaymentMethod } from '../models/enum/payment_method.enum';

export class TaxReportRepository {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private stockEntryRepository: Repository<StockEntry>;
  private stockEntryItemRepository: Repository<StockEntryItem>;
  private dataSource: DataSource;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.stockEntryRepository = AppDataSource.getRepository(StockEntry);
    this.stockEntryItemRepository = AppDataSource.getRepository(StockEntryItem);
    this.dataSource = AppDataSource;
  }

  /**
   * Get orders for VAT output (sales) report
   */
  async getOrdersForVatReport(
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      orderId: string;
      orderDate: Date;
      customerName: string;
      customerTaxCode: string | null;
      totalAmount: number;
      subTotal: number;
      discount: number;
      shippingFee: number;
      status: string;
      items: Array<{
        productName: string;
        quantity: number;
        rate: number;
        amount: number;
      }>;
    }>
  > {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.color', 'color')
      .where('order.created_at >= :startDate', { startDate })
      .andWhere('order.created_at <= :endDate', { endDate })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .orderBy('order.created_at', 'ASC')
      .getMany();

    return orders.map((order) => ({
      orderId: order.id,
      orderDate: order.createdAt,
      customerName: order.user?.fullname || 'N/A',
      customerTaxCode: order.user?.taxCode || null,
      totalAmount: order.totalAmount,
      subTotal: order.subTotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      status: order.status,
      items: order.items.map((item) => ({
        productName: item.product?.name || 'N/A',
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    }));
  }

  /**
   * Get stock entries for VAT input (purchases) report
   */
  async getStockEntriesForVatReport(
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      stockEntryId: string;
      entryDate: Date;
      supplierName: string | null;
      supplierTaxCode: string | null;
      totalCost: number;
      status: string;
      items: Array<{
        productName: string;
        quantity: number;
        rate: number;
        amount: number;
      }>;
    }>
  > {
    const stockEntries = await this.stockEntryRepository
      .createQueryBuilder('stockEntry')
      .leftJoinAndSelect('stockEntry.stockEntryItems', 'items')
      .leftJoinAndSelect('items.inventory', 'inventory')
      .leftJoinAndSelect('inventory.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('stockEntry.created_at >= :startDate', { startDate })
      .andWhere('stockEntry.created_at <= :endDate', { endDate })
      .andWhere('stockEntry.status = :status', {
        status: StockEntryStatus.SUBMITTED,
      })
      .andWhere('stockEntry.type = :type', { type: StockEntryType.IMPORT })
      .orderBy('stockEntry.created_at', 'ASC')
      .getMany();

    return stockEntries.map((entry) => ({
      stockEntryId: entry.id,
      entryDate: entry.createdAt,
      supplierName: entry.supplierName || null,
      supplierTaxCode: null, // Cần thêm field này vào model nếu có
      totalCost: entry.totalCost,
      status: entry.status,
      items: entry.stockEntryItems.map((item) => ({
        productName: item.inventory?.variant?.product?.name || 'N/A',
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
      })),
    }));
  }

  /**
   * Get revenue for CIT report
   */
  async getRevenueForCitReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    salesRevenue: number;
    totalOrders: number;
  }> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'salesRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .where('order.created_at >= :startDate', { startDate })
      .andWhere('order.created_at <= :endDate', { endDate })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .getRawOne();

    return {
      salesRevenue: parseFloat(result?.salesRevenue || '0'),
      totalOrders: parseInt(result?.totalOrders || '0'),
    };
  }

  /**
   * Get cost of goods sold for CIT report
   */
  async getCostOfGoodsSold(startDate: Date, endDate: Date): Promise<number> {
    // Tính giá vốn từ order items (dựa trên giá nhập kho)
    // Hoặc có thể tính từ inventory cost
    const result = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .select(
        'COALESCE(SUM(orderItem.quantity * orderItem.rate * 0.7), 0)',
        'cogs',
      )
      .where('order.created_at >= :startDate', { startDate })
      .andWhere('order.created_at <= :endDate', { endDate })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .getRawOne();

    return parseFloat(result?.cogs || '0');
  }

  /**
   * Get inventory value for balance sheet
   */
  async getInventoryValue(): Promise<number> {
    // Tính giá trị tồn kho hiện tại
    // Sử dụng giá nhập trung bình từ stock_entry_items
    const result = await this.dataSource.query(`
      SELECT COALESCE(SUM(inv.on_hand * COALESCE(avg_rate.avg_rate, 0)), 0) as inventory_value
      FROM inventories inv
      LEFT JOIN (
        SELECT 
          sei.inventory_id,
          AVG(sei.rate) as avg_rate
        FROM stock_entry_items sei
        GROUP BY sei.inventory_id
      ) avg_rate ON avg_rate.inventory_id = inv.id
      WHERE inv.on_hand > 0
    `);

    return parseFloat(result[0]?.inventory_value || '0');
  }

  /**
   * Get accounts receivable (COD orders pending collection)
   */
  async getAccountsReceivable(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'receivables')
      .where('order.is_cod = :isCod', { isCod: true })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.SHIPPING,
          OrderStatus.DELIVERED,
          OrderStatus.PENDING,
        ],
      })
      .getRawOne();

    return parseFloat(result?.receivables || '0');
  }

  /**
   * Get tax payable (VAT and CIT accumulated)
   */
  async getTaxPayable(): Promise<{
    vatPayable: number;
    citPayable: number;
  }> {
    // Tính thuế phải nộp từ các báo cáo thuế đã tạo
    // Tạm thời trả về 0, cần tích hợp với bảng lưu trữ thuế
    return {
      vatPayable: 0,
      citPayable: 0,
    };
  }

  /**
   * Get cash for balance sheet
   * Tính tiền mặt từ các đơn hàng đã hoàn thành thanh toán bằng tiền mặt
   */
  async getCash(
    paymentMethod: PaymentMethod,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'cash')
      .where('order.payment_method = :paymentMethod', { paymentMethod })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      });

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    const result = await queryBuilder.getRawOne();
    return parseFloat(result?.cash || '0');
  }

  /**
   * Get bank deposits for balance sheet
   * Tính tiền gửi ngân hàng từ các đơn hàng đã thanh toán qua ngân hàng
   */
  async getBankDeposits(startDate?: Date, endDate?: Date): Promise<number> {
    return this.getCash(PaymentMethod.BANK, startDate, endDate);
  }
}
