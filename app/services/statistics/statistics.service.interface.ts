export interface IStatisticsService {
  getDashboardStats(startDate?: Date, endDate?: Date): Promise<any>;
  getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number>;
  getRevenueByStatus(startDate?: Date, endDate?: Date): Promise<any[]>;
  getRevenueTimeSeries(
    period: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]>;
  getTopSellingProducts(
    limit?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]>;
  getProductStatistics(startDate?: Date, endDate?: Date): Promise<any>;
  getOrderStatistics(startDate?: Date, endDate?: Date): Promise<any>;
}
