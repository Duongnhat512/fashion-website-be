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

  // Doanh thu theo giờ (0-23)
  async getRevenueHourlySeries(
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{ hour: number; revenue: number; orders: number; profit: number }>
  > {
    // Nếu không có startDate/endDate, mặc định lấy hôm nay
    const start = startDate || new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate || new Date();
    end.setHours(23, 59, 59, 999);

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select('EXTRACT(HOUR FROM order.created_at)', 'hour')
      .addSelect('COALESCE(SUM(order.total_amount), 0)', 'revenue')
      .addSelect('COUNT(order.id)', 'orders')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .andWhere('order.created_at >= :start', { start })
      .andWhere('order.created_at <= :end', { end })
      .groupBy('hour')
      .orderBy('hour', 'ASC');

    const result = await queryBuilder.getRawMany();

    // Tính profit (revenue - cost)
    // Giả sử cost được tính từ order items (nếu có cost tracking)
    // Hoặc có thể tính từ warehouse/stock_entry
    const hourlyData = await Promise.all(
      result.map(async (item) => {
        const hour = parseInt(item.hour);

        // Tính cost cho giờ đó (nếu có model cost tracking)
        // Tạm thời profit = revenue * 0.7 (giả định margin 30%)
        // Bạn cần điều chỉnh logic này dựa trên cách tính cost thực tế
        const revenue = parseFloat(item.revenue || '0');
        const orders = parseInt(item.orders || '0');

        // Query để tính cost từ order items (nếu có cost field)
        // Tạm thời dùng ước tính
        const costQuery = this.orderItemRepository
          .createQueryBuilder('orderItem')
          .leftJoin('orderItem.order', 'order')
          .select(
            'COALESCE(SUM(orderItem.quantity * orderItem.rate * 0.7), 0)',
            'cost',
          )
          .where('EXTRACT(HOUR FROM order.created_at) = :hour', { hour })
          .andWhere('order.status IN (:...statuses)', {
            statuses: [
              OrderStatus.COMPLETED,
              OrderStatus.DELIVERED,
              OrderStatus.SHIPPING,
            ],
          })
          .andWhere('order.created_at >= :start', { start })
          .andWhere('order.created_at <= :end', { end });

        const costData = await costQuery.getRawOne();
        const cost = parseFloat(costData?.cost || '0');
        const profit = revenue - cost;

        return {
          hour,
          revenue,
          orders,
          profit: profit > 0 ? profit : 0,
        };
      }),
    );

    // Fill đầy các giờ từ 0-23 nếu thiếu
    const hourlyMap = new Map(hourlyData.map((item) => [item.hour, item]));
    const completeData = [];
    for (let h = 0; h < 24; h++) {
      if (hourlyMap.has(h)) {
        completeData.push(hourlyMap.get(h)!);
      } else {
        completeData.push({
          hour: h,
          revenue: 0,
          orders: 0,
          profit: 0,
        });
      }
    }

    return completeData;
  }

  // So sánh doanh thu
  async getRevenueComparison(date: Date): Promise<{
    current: { revenue: number; orders: number; profit: number };
    previous: { revenue: number; orders: number; profit: number };
    average: { revenue: number; orders: number; profit: number };
    comparison: {
      vsYesterday: { percentage: number; trend: 'up' | 'down' | 'same' };
      vsAverage: { percentage: number; trend: 'up' | 'down' | 'same' };
    };
  }> {
    // Ngày hiện tại
    const currentStart = new Date(date);
    currentStart.setHours(0, 0, 0, 0);
    const currentEnd = new Date(date);
    currentEnd.setHours(23, 59, 59, 999);

    // Ngày trước (hôm qua)
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousStart = new Date(previousDate);
    previousStart.setHours(0, 0, 0, 0);
    const previousEnd = new Date(previousDate);
    previousEnd.setHours(23, 59, 59, 999);

    // Trung bình (30 ngày trước đó)
    const avgStart = new Date(date);
    avgStart.setDate(avgStart.getDate() - 30);
    avgStart.setHours(0, 0, 0, 0);
    const avgEnd = new Date(previousDate);
    avgEnd.setHours(23, 59, 59, 999);

    // Lấy data ngày hiện tại
    const currentRevenue = await this.getTotalRevenue(currentStart, currentEnd);
    const currentOrdersQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'count')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .andWhere('order.created_at >= :start', { start: currentStart })
      .andWhere('order.created_at <= :end', { end: currentEnd });
    const currentOrdersData = await currentOrdersQuery.getRawOne();
    const currentOrders = parseInt(currentOrdersData?.count || '0');

    // Tính profit hiện tại
    const currentCost = await this.getTotalCost(currentStart, currentEnd);
    const currentProfit = currentRevenue - currentCost;

    // Lấy data ngày trước
    const previousRevenue = await this.getTotalRevenue(
      previousStart,
      previousEnd,
    );
    const previousOrdersQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'count')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .andWhere('order.created_at >= :start', { start: previousStart })
      .andWhere('order.created_at <= :end', { end: previousEnd });
    const previousOrdersData = await previousOrdersQuery.getRawOne();
    const previousOrders = parseInt(previousOrdersData?.count || '0');

    const previousCost = await this.getTotalCost(previousStart, previousEnd);
    const previousProfit = previousRevenue - previousCost;

    // Lấy data trung bình
    const avgRevenue = await this.getTotalRevenue(avgStart, avgEnd);
    const avgOrdersQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(order.id)', 'count')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .andWhere('order.created_at >= :start', { start: avgStart })
      .andWhere('order.created_at <= :end', { end: avgEnd });
    const avgOrdersData = await avgOrdersQuery.getRawOne();
    const avgOrders = parseInt(avgOrdersData?.count || '0') / 30; // Trung bình mỗi ngày

    const avgCost = (await this.getTotalCost(avgStart, avgEnd)) / 30;
    const avgProfit = (avgRevenue - avgCost * 30) / 30;
    const avgRevenuePerDay = avgRevenue / 30;

    // Tính phần trăm so sánh
    const calculateTrend = (
      current: number,
      compare: number,
    ): 'up' | 'down' | 'same' => {
      if (current > compare) return 'up';
      if (current < compare) return 'down';
      return 'same';
    };

    const calculatePercentage = (current: number, compare: number): number => {
      if (compare === 0) return current > 0 ? 100 : 0;
      return ((current - compare) / compare) * 100;
    };

    const vsYesterdayPercentage = calculatePercentage(
      currentProfit,
      previousProfit,
    );
    const vsAveragePercentage = calculatePercentage(currentProfit, avgProfit);

    return {
      current: {
        revenue: currentRevenue,
        orders: currentOrders,
        profit: currentProfit,
      },
      previous: {
        revenue: previousRevenue,
        orders: previousOrders,
        profit: previousProfit,
      },
      average: {
        revenue: avgRevenuePerDay,
        orders: Math.round(avgOrders),
        profit: avgProfit,
      },
      comparison: {
        vsYesterday: {
          percentage: parseFloat(vsYesterdayPercentage.toFixed(2)),
          trend: calculateTrend(currentProfit, previousProfit),
        },
        vsAverage: {
          percentage: parseFloat(vsAveragePercentage.toFixed(2)),
          trend: calculateTrend(currentProfit, avgProfit),
        },
      },
    };
  }

  // Helper method để tính cost (cần điều chỉnh dựa trên logic thực tế)
  private async getTotalCost(startDate: Date, endDate: Date): Promise<number> {
    // Tính cost từ order items
    // Giả sử cost = rate * quantity * 0.7 (margin 30%)
    // Bạn cần điều chỉnh logic này dựa trên cách lưu cost thực tế
    const costQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .select(
        'COALESCE(SUM(orderItem.quantity * orderItem.rate * 0.7), 0)',
        'cost',
      )
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .andWhere('order.created_at >= :startDate', { startDate })
      .andWhere('order.created_at <= :endDate', { endDate });

    const result = await costQuery.getRawOne();
    return parseFloat(result?.cost || '0');
  }

  // Profit time series
  async getProfitTimeSeries(
    period: 'day' | 'week' | 'month' | 'year' | 'hour',
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{ date: string; profit: number; revenue: number; cost: number }>
  > {
    let dateFormat: string;
    let dateGroup: string;

    switch (period) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24';
        dateGroup = `TO_CHAR(order.created_at, '${dateFormat}')`;
        break;
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        dateGroup = `TO_CHAR(order.created_at, '${dateFormat}')`;
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        dateGroup = `TO_CHAR(order.created_at, '${dateFormat}')`;
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGroup = `TO_CHAR(order.created_at, '${dateFormat}')`;
        break;
      case 'year':
        dateFormat = 'YYYY';
        dateGroup = `TO_CHAR(order.created_at, '${dateFormat}')`;
        break;
    }

    const revenueQuery = this.orderRepository
      .createQueryBuilder('order')
      .select(dateGroup, 'date')
      .addSelect('COALESCE(SUM(order.total_amount), 0)', 'revenue')
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
      revenueQuery.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      revenueQuery.andWhere('order.created_at <= :endDate', { endDate });
    }

    const revenueData = await revenueQuery.getRawMany();

    const result = await Promise.all(
      revenueData.map(async (item) => {
        const dateStr = item.date;
        let periodStart: Date;
        let periodEnd: Date;

        if (period === 'hour') {
          periodStart = new Date(dateStr + ':00:00');
          periodEnd = new Date(dateStr + ':59:59');
        } else if (period === 'day') {
          periodStart = new Date(dateStr + 'T00:00:00');
          periodEnd = new Date(dateStr + 'T23:59:59');
        } else {
          periodStart = new Date(dateStr);
          periodEnd = new Date(dateStr);
          if (period === 'week') {
          }
        }

        const revenue = parseFloat(item.revenue || '0');
        const cost = await this.getTotalCost(periodStart, periodEnd);
        const profit = revenue - cost;

        return {
          date: dateStr,
          profit: profit > 0 ? profit : 0,
          revenue,
          cost,
        };
      }),
    );

    return result;
  }

  async getProductSalesDetail(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalProducts: number;
    activeProducts: number;
    inStockProducts: number;
    viewedProducts: number;
    productsOnSale: number;
    productsSold: number;
    productViews: number;
    productVisitors: number;
    stockRate: number;
    viewRate: number;
    saleRate: number;
  }> {
    const totalProducts = await this.productRepository.count();

    const activeProducts = await this.productRepository.count({
      where: { status: 'active' },
    });

    const inStockProducts = activeProducts;

    const viewedProductsQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .select('COUNT(DISTINCT product.id)', 'count');
    if (startDate) {
      viewedProductsQuery
        .leftJoin('orderItem.order', 'order')
        .andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      viewedProductsQuery
        .leftJoin('orderItem.order', 'order')
        .andWhere('order.created_at <= :endDate', { endDate });
    }
    const viewedProductsData = await viewedProductsQuery.getRawOne();
    const viewedProducts = parseInt(viewedProductsData?.count || '0');

    const productsOnSaleQuery = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.variants', 'variant')
      .where('variant.on_sales = :onSales', { onSales: true })
      .select('COUNT(DISTINCT product.id)', 'count');
    const productsOnSaleData = await productsOnSaleQuery.getRawOne();
    const productsOnSale = parseInt(productsOnSaleData?.count || '0');

    const productsSoldQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .select('COUNT(DISTINCT product.id)', 'count')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      });
    if (startDate) {
      productsSoldQuery.andWhere('order.created_at >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      productsSoldQuery.andWhere('order.created_at <= :endDate', { endDate });
    }
    const productsSoldData = await productsSoldQuery.getRawOne();
    const productsSold = parseInt(productsSoldData?.count || '0');

    // Product views (nếu có product_views table)
    // Tạm thời dùng số lượng order items như proxy
    const productViewsQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('SUM(orderItem.quantity)', 'views');
    if (startDate) {
      productViewsQuery
        .leftJoin('orderItem.order', 'order')
        .andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      productViewsQuery
        .leftJoin('orderItem.order', 'order')
        .andWhere('order.created_at <= :endDate', { endDate });
    }
    const productViewsData = await productViewsQuery.getRawOne();
    const productViews = parseInt(productViewsData?.views || '0');

    // Product visitors (số unique customers mua sản phẩm)
    const productVisitorsQuery = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .select('COUNT(DISTINCT order.user_id)', 'visitors')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      });
    if (startDate) {
      productVisitorsQuery.andWhere('order.created_at >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      productVisitorsQuery.andWhere('order.created_at <= :endDate', {
        endDate,
      });
    }
    const productVisitorsData = await productVisitorsQuery.getRawOne();
    const productVisitors = parseInt(productVisitorsData?.visitors || '0');

    // Tính các rates
    const stockRate =
      totalProducts > 0 ? (inStockProducts / totalProducts) * 100 : 0;
    const viewRate =
      totalProducts > 0 ? (viewedProducts / totalProducts) * 100 : 0;
    const saleRate =
      totalProducts > 0 ? (productsOnSale / totalProducts) * 100 : 0;

    return {
      totalProducts,
      activeProducts,
      inStockProducts,
      viewedProducts,
      productsOnSale,
      productsSold,
      productViews,
      productVisitors,
      stockRate: parseFloat(stockRate.toFixed(2)),
      viewRate: parseFloat(viewRate.toFixed(2)),
      saleRate: parseFloat(saleRate.toFixed(2)),
    };
  }

  // Top sản phẩm theo doanh thu
  async getTopProductsByRevenue(
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      productImage: string;
      revenue: number;
      quantity: number;
      orders: number;
    }>
  > {
    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.image_url', 'productImage')
      .addSelect('SUM(orderItem.amount)', 'revenue')
      .addSelect('SUM(orderItem.quantity)', 'quantity')
      .addSelect('COUNT(DISTINCT order.id)', 'orders')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.COMPLETED,
          OrderStatus.DELIVERED,
          OrderStatus.SHIPPING,
        ],
      })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.image_url')
      .orderBy('SUM(orderItem.amount)', 'DESC')
      .limit(limit);

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    const result = await queryBuilder.getRawMany();

    return result.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage || '',
      revenue: parseFloat(item.revenue || '0'),
      quantity: parseInt(item.quantity || '0'),
      orders: parseInt(item.orders || '0'),
    }));
  }

  // Top sản phẩm theo lượt xem
  async getTopProductsByViews(
    limit: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      productImage: string;
      views: number;
      visitors: number;
      conversionRate: number;
    }>
  > {
    // Nếu có product_views table, query từ đó
    // Tạm thời dùng số lượng order items làm proxy cho views
    const queryBuilder = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.product', 'product')
      .leftJoin('orderItem.order', 'order')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('product.image_url', 'productImage')
      .addSelect('SUM(orderItem.quantity)', 'views')
      .addSelect('COUNT(DISTINCT order.user_id)', 'visitors')
      .addSelect(
        `CASE 
          WHEN COUNT(DISTINCT order.user_id) > 0 
          THEN (COUNT(DISTINCT order.id)::float / COUNT(DISTINCT order.user_id)::float) * 100
          ELSE 0 
        END`,
        'conversionRate',
      )
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('product.image_url')
      .orderBy('SUM(orderItem.quantity)', 'DESC')
      .limit(limit);

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    const result = await queryBuilder.getRawMany();

    return result.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage || '',
      views: parseInt(item.views || '0'),
      visitors: parseInt(item.visitors || '0'),
      conversionRate: parseFloat(item.conversionRate || '0'),
    }));
  }
}
