import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config/env';
import {
  IRevenueForecastService,
  RevenueForecastResponse,
} from '../revenue_forecast.service.interface';
import { StatisticsRepository } from '../../../repositories/statistics.repository';
import logger from '../../../utils/logger';

export class RevenueForecastService implements IRevenueForecastService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private statisticsRepository: StatisticsRepository;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.statisticsRepository = new StatisticsRepository();

    // Initialize Gemini model for revenue forecasting
    this.model = this.genAI.getGenerativeModel({
      model: config.gemini.model || 'gemini-1.5-flash',
      systemInstruction: `
        Bạn là một chuyên gia phân tích tài chính và dự báo doanh thu chuyên nghiệp.
        Nhiệm vụ của bạn là phân tích dữ liệu doanh thu lịch sử và đưa ra dự báo chính xác cho tương lai.
        
        Bạn cần:
        1. Phân tích xu hướng (trend) từ dữ liệu lịch sử
        2. Xác định các pattern theo ngày/tuần/tháng
        3. Đưa ra dự báo với mức độ tin cậy hợp lý
        4. Cung cấp insights và khuyến nghị cụ thể
        
        Trả lời bằng JSON format theo cấu trúc đã định nghĩa.
      `,
    });
  }

  async generateForecast(
    period: 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<RevenueForecastResponse> {
    try {
      // Calculate date range for historical data
      // Default: last 90 days for week/month, last year for quarter/year
      const defaultEndDate = endDate || new Date();
      let defaultStartDate: Date;

      if (period === 'week' || period === 'month') {
        defaultStartDate =
          startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      } else {
        defaultStartDate =
          startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      }

      // Get historical revenue time series data
      const historicalData =
        await this.statisticsRepository.getRevenueTimeSeries(
          period === 'week' ? 'day' : period === 'month' ? 'day' : 'month',
          defaultStartDate,
          defaultEndDate,
        );

      // Get total revenue for the period
      const totalRevenue = await this.statisticsRepository.getTotalRevenue(
        defaultStartDate,
        defaultEndDate,
      );

      // Calculate average daily revenue
      const daysDiff =
        (defaultEndDate.getTime() - defaultStartDate.getTime()) /
        (1000 * 60 * 60 * 24);
      const averageDailyRevenue = totalRevenue / Math.max(daysDiff, 1);

      // Calculate trend and growth rate
      const { trend, growthRate } = this.calculateTrend(historicalData);

      // Prepare prompt for Gemini
      const prompt = this.buildForecastPrompt(
        historicalData,
        totalRevenue,
        averageDailyRevenue,
        trend,
        growthRate,
        period,
      );

      // Get forecast from Gemini
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse Gemini response
      const forecastData = this.parseGeminiResponse(
        text,
        historicalData,
        totalRevenue,
        averageDailyRevenue,
        trend,
        growthRate,
        period,
      );

      return forecastData;
    } catch (error) {
      logger.error('Error generating revenue forecast:', error);
      // Return fallback forecast if Gemini fails
      return this.generateFallbackForecast(
        period,
        await this.statisticsRepository.getTotalRevenue(),
      );
    }
  }

  /**
   * Build prompt for Gemini AI
   */
  private buildForecastPrompt(
    historicalData: Array<{ date: string; revenue: number; count: number }>,
    totalRevenue: number,
    averageDailyRevenue: number,
    trend: 'increasing' | 'decreasing' | 'stable',
    growthRate: number,
    period: 'week' | 'month' | 'quarter' | 'year',
  ): string {
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const periodText = {
      week: '7 ngày tới',
      month: '30 ngày tới (1 tháng)',
      quarter: '90 ngày tới (1 quý)',
      year: '365 ngày tới (1 năm)',
    };

    return `
Bạn là chuyên gia phân tích tài chính. Hãy phân tích dữ liệu doanh thu lịch sử và đưa ra dự báo cho ${
      periodText[period]
    }.

## DỮ LIỆU LỊCH SỬ:
${historicalData
  .slice(-30)
  .map(
    (item) =>
      `- ${item.date}: ${item.revenue.toLocaleString('vi-VN')} VNĐ (${
        item.count
      } đơn hàng)`,
  )
  .join('\n')}

## THỐNG KÊ:
- Tổng doanh thu trong kỳ phân tích: ${totalRevenue.toLocaleString('vi-VN')} VNĐ
- Doanh thu trung bình/ngày: ${averageDailyRevenue.toLocaleString('vi-VN')} VNĐ
- Xu hướng: ${
      trend === 'increasing'
        ? 'Tăng'
        : trend === 'decreasing'
        ? 'Giảm'
        : 'Ổn định'
    }
- Tốc độ tăng trưởng: ${growthRate.toFixed(2)}%

## YÊU CẦU:
Hãy phân tích và trả về kết quả dưới dạng JSON với cấu trúc sau (chỉ trả về JSON, không có text khác):

{
  "predictedRevenue": <số doanh thu dự báo cho ${periodText[period]}>,
  "confidence": "low" | "medium" | "high",
  "range": {
    "min": <kịch bản bi quan>,
    "max": <kịch bản lạc quan>
  },
  "insights": {
    "summary": "<tóm tắt phân tích trong 2-3 câu bằng tiếng Việt>",
    "factors": [
      "<yếu tố 1 ảnh hưởng đến dự báo>",
      "<yếu tố 2>",
      "<yếu tố 3>"
    ],
    "recommendations": [
      "<khuyến nghị 1 để cải thiện doanh thu>",
      "<khuyến nghị 2>",
      "<khuyến nghị 3>"
    ]
  }
}

## LƯU Ý:
- Dựa vào xu hướng và tốc độ tăng trưởng để tính toán
- Confidence: "high" nếu có nhiều dữ liệu và xu hướng rõ ràng, "medium" nếu có đủ dữ liệu, "low" nếu ít dữ liệu
- Range min/max: ±20-30% so với predictedRevenue
- Insights và recommendations phải thực tế và có thể áp dụng
`;
  }

  /**
   * Parse Gemini response and build forecast response
   */
  private parseGeminiResponse(
    text: string,
    historicalData: Array<{ date: string; revenue: number; count: number }>,
    totalRevenue: number,
    averageDailyRevenue: number,
    trend: 'increasing' | 'decreasing' | 'stable',
    growthRate: number,
    period: 'week' | 'month' | 'quarter' | 'year',
  ): RevenueForecastResponse {
    try {
      // Extract JSON from Gemini response (might have markdown formatting)
      let jsonStr = text.trim();

      // Remove markdown code blocks if present
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonStr);

      // Calculate forecast date
      const forecastDate = new Date();
      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };
      forecastDate.setDate(forecastDate.getDate() + periodDays[period]);

      return {
        forecast: {
          period,
          forecastDate: forecastDate.toISOString(),
          predictedRevenue:
            parsed.predictedRevenue ||
            this.calculateSimpleForecast(averageDailyRevenue, period),
          confidence: parsed.confidence || 'medium',
          range: parsed.range || {
            min: (parsed.predictedRevenue || 0) * 0.7,
            max: (parsed.predictedRevenue || 0) * 1.3,
          },
        },
        historicalData: {
          totalRevenue,
          averageDailyRevenue,
          trend,
          growthRate,
          dataPoints: historicalData.slice(-30).map((item) => ({
            date: item.date,
            revenue: item.revenue,
          })),
        },
        insights: parsed.insights || {
          summary: `Dựa trên xu hướng ${
            trend === 'increasing'
              ? 'tăng'
              : trend === 'decreasing'
              ? 'giảm'
              : 'ổn định'
          } (${growthRate.toFixed(
            2,
          )}%), doanh thu dự kiến sẽ phát triển theo hướng tương tự.`,
          factors: [
            'Xu hướng lịch sử',
            'Tốc độ tăng trưởng',
            'Số lượng đơn hàng trung bình',
          ],
          recommendations: [
            'Tối ưu hóa chiến dịch marketing để tăng doanh thu',
            'Theo dõi sát sao các chỉ số để điều chỉnh kịp thời',
            'Nâng cao chất lượng dịch vụ để tăng tỷ lệ chuyển đổi',
          ],
        },
        metadata: {
          analyzedDataPoints: historicalData.length,
          forecastGeneratedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error parsing Gemini response, using fallback:', error);
      // Fallback to simple calculation
      return this.generateFallbackForecast(
        period,
        totalRevenue,
        historicalData,
        averageDailyRevenue,
        trend,
        growthRate,
      );
    }
  }

  /**
   * Calculate trend and growth rate from historical data
   */
  private calculateTrend(
    data: Array<{ date: string; revenue: number; count: number }>,
  ): {
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number;
  } {
    if (data.length < 2) {
      return { trend: 'stable', growthRate: 0 };
    }

    // Take last 30 days or all if less
    const recentData = data.slice(-30);
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, item) => sum + item.revenue, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, item) => sum + item.revenue, 0) /
      secondHalf.length;

    const growthRate =
      firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (growthRate > 5) {
      trend = 'increasing';
    } else if (growthRate < -5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return { trend, growthRate };
  }

  /**
   * Calculate simple forecast based on average daily revenue
   */
  private calculateSimpleForecast(
    averageDailyRevenue: number,
    period: 'week' | 'month' | 'quarter' | 'year',
  ): number {
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    return averageDailyRevenue * periodDays[period];
  }

  /**
   * Generate fallback forecast if Gemini fails
   */
  private generateFallbackForecast(
    period: 'week' | 'month' | 'quarter' | 'year',
    totalRevenue: number,
    historicalData?: Array<{ date: string; revenue: number; count: number }>,
    averageDailyRevenue?: number,
    trend?: 'increasing' | 'decreasing' | 'stable',
    growthRate?: number,
  ): RevenueForecastResponse {
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const avgDaily = averageDailyRevenue || totalRevenue / 90; // Default to 90 days
    const predictedRevenue = this.calculateSimpleForecast(avgDaily, period);
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + periodDays[period]);

    const calcTrend = trend || 'stable';
    const calcGrowthRate = growthRate || 0;

    return {
      forecast: {
        period,
        forecastDate: forecastDate.toISOString(),
        predictedRevenue,
        confidence: 'low',
        range: {
          min: predictedRevenue * 0.7,
          max: predictedRevenue * 1.3,
        },
      },
      historicalData: {
        totalRevenue,
        averageDailyRevenue: avgDaily,
        trend: calcTrend,
        growthRate: calcGrowthRate,
        dataPoints:
          historicalData?.slice(-30).map((item) => ({
            date: item.date,
            revenue: item.revenue,
          })) || [],
      },
      insights: {
        summary: `Dự báo dựa trên doanh thu trung bình hàng ngày. Xu hướng hiện tại: ${
          calcTrend === 'increasing'
            ? 'tăng'
            : calcTrend === 'decreasing'
            ? 'giảm'
            : 'ổn định'
        }.`,
        factors: [
          'Doanh thu trung bình trong kỳ phân tích',
          'Xu hướng lịch sử',
          'Số ngày trong kỳ dự báo',
        ],
        recommendations: [
          'Thu thập thêm dữ liệu để cải thiện độ chính xác dự báo',
          'Theo dõi các chỉ số doanh thu hàng ngày',
          'Phân tích các yếu tố ảnh hưởng đến doanh thu',
        ],
      },
      metadata: {
        analyzedDataPoints: historicalData?.length || 0,
        forecastGeneratedAt: new Date().toISOString(),
      },
    };
  }
}
