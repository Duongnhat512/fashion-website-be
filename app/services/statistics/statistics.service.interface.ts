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
  getProductSalesDetail(
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
  }>;
  getTopProductsByRevenue(
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
  >;
  getTopProductsByViews(
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
  >;
  getRevenueHourlySeries(
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{ hour: number; revenue: number; orders: number; profit: number }>
  >;

  getRevenueComparison(date: Date): Promise<{
    current: { revenue: number; orders: number; profit: number };
    previous: { revenue: number; orders: number; profit: number };
    average: { revenue: number; orders: number; profit: number };
    comparison: {
      vsYesterday: { percentage: number; trend: 'up' | 'down' | 'same' };
      vsAverage: { percentage: number; trend: 'up' | 'down' | 'same' };
    };
  }>;

  getProfitTimeSeries(
    period: 'day' | 'week' | 'month' | 'year' | 'hour',
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{ date: string; profit: number; revenue: number; cost: number }>
  >;
}
