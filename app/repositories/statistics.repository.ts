import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { Order } from '../models/order.model';
import { OrderItem } from '../models/order_item.model';
import { Product } from '../models/product.model';
import OrderStatus from '../models/enum/order_status.enum';
import User from '../models/user.model';

export class StatisticsRepository {
  private orderRepository: Repository<Order>;
  private orderItemRepository: Repository<OrderItem>;
  private productRepository: Repository<Product>;
  private dataSource: DataSource;
  private userRepository: Repository<User>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(Order);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
    this.productRepository = AppDataSource.getRepository(Product);
    this.dataSource = AppDataSource;
    this.userRepository = AppDataSource.getRepository(User);
  }

  // Tổng doanh thu
  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'total')
      .where('order.status IN (:...statuses)', {
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
    return parseFloat(result?.total || '0');
  }

  // Doanh thu theo trạng thái
  async getRevenueByStatus(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ status: string; revenue: number; count: number }>> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COALESCE(SUM(order.total_amount), 0)', 'revenue')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status');

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    return queryBuilder.getRawMany();
  }

  // Doanh thu theo thời gian (cho biểu đồ)
  async getRevenueTimeSeries(
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ date: string; revenue: number; count: number }>> {
    let dateFormat: string;
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select(`TO_CHAR(order.created_at, '${dateFormat}')`, 'date')
      .addSelect('COALESCE(SUM(order.total_amount), 0)', 'revenue')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    return queryBuilder.getRawMany();
  }

  // Top sản phẩm bán chạy
  async getTopSellingProducts(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
    }>
  > {
    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(orderItem.quantity)', 'totalQuantity')
      .addSelect('SUM(orderItem.amount)', 'totalRevenue')
      .addSelect('COUNT(DISTINCT order.id)', 'orderCount')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('SUM(orderItem.quantity)', 'DESC')
      .limit(limit);

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    return queryBuilder.getRawMany();
  }

  // Thống kê sản phẩm
  async getProductStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalProducts: number;
    totalSold: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const totalProducts = await this.productRepository.count();

    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .select('SUM(orderItem.quantity)', 'totalSold')
      .addSelect('SUM(orderItem.amount)', 'totalRevenue')
      .where('order.status IN (:...statuses)', {
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

    const salesData = await queryBuilder.getRawOne();

    // Tính giá trị đơn hàng trung bình
    const avgOrderQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(order.total_amount)', 'avgOrderValue')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      });

    if (startDate) {
      avgOrderQuery.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      avgOrderQuery.andWhere('order.created_at <= :endDate', { endDate });
    }

    const avgOrderData = await avgOrderQuery.getRawOne();

    return {
      totalProducts,
      totalSold: parseInt(salesData?.totalSold || '0'),
      totalRevenue: parseFloat(salesData?.totalRevenue || '0'),
      averageOrderValue: parseFloat(avgOrderData?.avgOrderValue || '0'),
    };
  }

  // Thống kê đơn hàng
  async getOrderStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalOrders: number;
    ordersByStatus: Array<{ status: string; count: number }>;
    cancelledRate: number;
    averageOrderValue: number;
  }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count');

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    const ordersByStatus = await queryBuilder
      .groupBy('order.status')
      .getRawMany();

    const totalOrders = ordersByStatus.reduce(
      (sum, item) => sum + parseInt(item.count),
      0,
    );

    const cancelledCount =
      ordersByStatus.find((item) => item.status === OrderStatus.CANCELLED)
        ?.count || 0;
    const cancelledRate =
      totalOrders > 0 ? (cancelledCount / totalOrders) * 100 : 0;

    // Giá trị đơn hàng trung bình
    const avgQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(order.total_amount)', 'avgOrderValue')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      });

    if (startDate) {
      avgQuery.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      avgQuery.andWhere('order.created_at <= :endDate', { endDate });
    }

    const avgData = await avgQuery.getRawOne();

    return {
      totalOrders,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: parseInt(item.count),
      })),
      cancelledRate: parseFloat(cancelledRate.toFixed(2)),
      averageOrderValue: parseFloat(avgData?.avgOrderValue || '0'),
    };
  }

  async getDashboardStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    recentOrders: number;
  }> {
    const totalRevenue = await this.getTotalRevenue(startDate, endDate);

    // Tổng đơn hàng
    const orderQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'count');
    if (startDate) {
      orderQuery.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      orderQuery.andWhere('order.created_at <= :endDate', { endDate });
    }
    const orderData = await orderQuery.getRawOne();

    const customerQuery = this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(DISTINCT user.id)', 'count');
    const customerData = await customerQuery.getRawOne();

    const totalProducts = await this.productRepository.count();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentOrdersQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'count')
      .where('order.created_at >= :sevenDaysAgo', { sevenDaysAgo });
    const recentOrdersData = await recentOrdersQuery.getRawOne();

    return {
      totalRevenue,
      totalOrders: parseInt(orderData?.count || '0'),
      totalCustomers: parseInt(customerData?.count || '0'),
      totalProducts,
      recentOrders: parseInt(recentOrdersData?.count || '0'),
    };
  }
}
