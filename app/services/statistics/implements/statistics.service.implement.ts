import { IStatisticsService } from '../statistics.service.interface';
import { StatisticsRepository } from '../../../repositories/statistics.repository';

export class StatisticsService implements IStatisticsService {
  private readonly statisticsRepository: StatisticsRepository;

  constructor() {
    this.statisticsRepository = new StatisticsRepository();
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
    return this.statisticsRepository.getDashboardStats(startDate, endDate);
  }

  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    return this.statisticsRepository.getTotalRevenue(startDate, endDate);
  }

  async getRevenueByStatus(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ status: string; revenue: number; count: number }>> {
    return this.statisticsRepository.getRevenueByStatus(startDate, endDate);
  }

  async getRevenueTimeSeries(
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ date: string; revenue: number; count: number }>> {
    return this.statisticsRepository.getRevenueTimeSeries(
      period,
      startDate,
      endDate,
    );
  }

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
    return this.statisticsRepository.getTopSellingProducts(
      limit,
      startDate,
      endDate,
    );
  }

  async getProductStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalProducts: number;
    totalSold: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    return this.statisticsRepository.getProductStatistics(startDate, endDate);
  }

  async getOrderStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalOrders: number;
    ordersByStatus: Array<{ status: string; count: number }>;
    cancelledRate: number;
    averageOrderValue: number;
  }> {
    return this.statisticsRepository.getOrderStatistics(startDate, endDate);
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
    return this.statisticsRepository.getProductSalesDetail(startDate, endDate);
  }

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
    return this.statisticsRepository.getTopProductsByRevenue(
      limit,
      startDate,
      endDate,
    );
  }

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
    return this.statisticsRepository.getTopProductsByViews(
      limit,
      startDate,
      endDate,
    );
  }

  async getRevenueHourlySeries(
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{ hour: number; revenue: number; orders: number; profit: number }>
  > {
    return this.statisticsRepository.getRevenueHourlySeries(startDate, endDate);
  }

  async getRevenueComparison(date: Date): Promise<{
    current: { revenue: number; orders: number; profit: number };
    previous: { revenue: number; orders: number; profit: number };
    average: { revenue: number; orders: number; profit: number };
    comparison: {
      vsYesterday: { percentage: number; trend: 'up' | 'down' | 'same' };
      vsAverage: { percentage: number; trend: 'up' | 'down' | 'same' };
    };
  }> {
    return this.statisticsRepository.getRevenueComparison(date);
  }

  async getProfitTimeSeries(
    period: 'day' | 'week' | 'month' | 'year' | 'hour',
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{ date: string; profit: number; revenue: number; cost: number }>
  > {
    return this.statisticsRepository.getProfitTimeSeries(
      period,
      startDate,
      endDate,
    );
  }
}
