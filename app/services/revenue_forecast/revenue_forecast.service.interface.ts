/**
 * Revenue Forecast Service Interface
 * Uses Gemini AI to predict future revenue based on historical data
 */
export interface IRevenueForecastService {
  /**
   * Generate revenue forecast using Gemini AI
   * @param period - Forecast period: 'week' | 'month' | 'quarter' | 'year'
   * @param startDate - Start date for historical data analysis (optional)
   * @param endDate - End date for historical data analysis (optional)
   * @returns Forecast data with predictions and insights
   */
  generateForecast(
    period: 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<RevenueForecastResponse>;
}

/**
 * Revenue Forecast Response
 */
export interface RevenueForecastResponse {
  forecast: {
    period: 'week' | 'month' | 'quarter' | 'year';
    forecastDate: string; // ISO date string
    predictedRevenue: number;
    confidence: 'low' | 'medium' | 'high'; // Confidence level
    range: {
      min: number; // Pessimistic scenario
      max: number; // Optimistic scenario
    };
  };
  historicalData: {
    totalRevenue: number;
    averageDailyRevenue: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number; // Percentage
    dataPoints: Array<{
      date: string;
      revenue: number;
    }>;
  };
  insights: {
    summary: string; // AI-generated summary
    factors: string[]; // Key factors affecting forecast
    recommendations: string[]; // AI-generated recommendations
  };
  metadata: {
    analyzedDataPoints: number;
    forecastGeneratedAt: string; // ISO timestamp
  };
}

