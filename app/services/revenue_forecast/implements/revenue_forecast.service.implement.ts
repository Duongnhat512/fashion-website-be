import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config/env';
import {
  IRevenueForecastService,
  RevenueForecastResponse,
} from '../revenue_forecast.service.interface';
import { StatisticsRepository } from '../../../repositories/statistics.repository';
import logger from '../../../utils/logger';
import redis from '../../../config/redis.config';
import { GeminiKeyManager } from '../../gemini_key_manager/implements/gemini_key_manager.service.implement';

export class RevenueForecastService implements IRevenueForecastService {
  private keyManager: GeminiKeyManager;
  private statisticsRepository: StatisticsRepository;

  // Cache keys and TTL
  private readonly CACHE_PREFIX = 'revenue:forecast:';
  private readonly CACHE_TTL = {
    week: 3600, // 1 hour for weekly forecast
    month: 3600, // 1 hour for monthly forecast
    quarter: 21600, // 6 hours for quarterly forecast
    year: 86400, // 24 hours for yearly forecast
  };

  constructor() {
    this.keyManager = new GeminiKeyManager(config.gemini.apiKeys);
    this.statisticsRepository = new StatisticsRepository();
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

      // Generate cache key based on period and date range
      const cacheKey = this.getCacheKey(
        period,
        defaultStartDate,
        defaultEndDate,
      );

      // Try to get from cache first
      const cachedForecast = await this.getCachedForecast(cacheKey);
      if (cachedForecast) {
        logger.info(`Revenue forecast cache hit for period: ${period}`);
        return cachedForecast;
      }

      logger.info(
        `Revenue forecast cache miss, generating new forecast for period: ${period}`,
      );

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

      // Prepare prompt for Gemini (optimized - less data points)
      const prompt = this.buildForecastPrompt(
        historicalData,
        totalRevenue,
        averageDailyRevenue,
        trend,
        growthRate,
        period,
      );

      // Get forecast from Gemini with key rotation and timeout
      const forecastData = await this.getForecastFromGemini(
        prompt,
        historicalData,
        totalRevenue,
        averageDailyRevenue,
        trend,
        growthRate,
        period,
      );

      // Cache the result
      await this.cacheForecast(cacheKey, forecastData, period);

      return forecastData;
    } catch (error) {
      logger.error('Error generating revenue forecast:', error);
      // Return fallback forecast if Gemini fails
      try {
        const totalRevenue = await this.statisticsRepository.getTotalRevenue();
        return this.generateFallbackForecast(period, totalRevenue);
      } catch (fallbackError) {
        logger.error('Error in fallback forecast:', fallbackError);
        // Return minimal forecast
        return this.generateMinimalForecast(period);
      }
    }
  }

  /**
   * Generate cache key for forecast
   */
  private getCacheKey(period: string, startDate: Date, endDate: Date): string {
    // Round dates to hour for better cache hits
    const startHour = new Date(startDate);
    startHour.setMinutes(0, 0, 0);
    const endHour = new Date(endDate);
    endHour.setMinutes(0, 0, 0);

    return `${
      this.CACHE_PREFIX
    }${period}:${startHour.getTime()}:${endHour.getTime()}`;
  }

  /**
   * Get cached forecast from Redis
   */
  private async getCachedForecast(
    cacheKey: string,
  ): Promise<RevenueForecastResponse | null> {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as RevenueForecastResponse;
      }
      return null;
    } catch (error) {
      logger.warn('Error reading forecast cache:', error);
      return null;
    }
  }

  /**
   * Cache forecast result in Redis
   */
  private async cacheForecast(
    cacheKey: string,
    forecast: RevenueForecastResponse,
    period: 'week' | 'month' | 'quarter' | 'year',
  ): Promise<void> {
    try {
      const ttl = this.CACHE_TTL[period];
      await redis.setex(cacheKey, ttl, JSON.stringify(forecast));
      logger.debug(`Cached forecast with TTL ${ttl}s for key: ${cacheKey}`);
    } catch (error) {
      logger.warn('Error caching forecast:', error);
      // Don't throw - caching failure shouldn't break the flow
    }
  }

  /**
   * Get forecast from Gemini with key rotation and retry logic
   */
  private async getForecastFromGemini(
    prompt: string,
    historicalData: Array<{ date: string; revenue: number; count: number }>,
    totalRevenue: number,
    averageDailyRevenue: number,
    trend: 'increasing' | 'decreasing' | 'stable',
    growthRate: number,
    period: 'week' | 'month' | 'quarter' | 'year',
  ): Promise<RevenueForecastResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let apiKey: string | null = null;

      try {
        // Get available API key
        apiKey = await this.keyManager.getAvailableKey();
        if (!apiKey) {
          throw new Error(
            'No available Gemini API keys. All keys have reached daily limit.',
          );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: config.gemini.model || 'gemini-2.5-flash',
          systemInstruction: `
            Bạn là một chuyên gia phân tích tài chính và dự báo doanh thu hàng đầu với hơn 15 năm kinh nghiệm trong lĩnh vực e-commerce và retail analytics.

            ## NHIỆM VỤ CHÍNH:
            Phân tích dữ liệu doanh thu lịch sử và đưa ra dự báo chính xác, có cơ sở khoa học cho các kỳ tương lai (tuần/tháng/quý/năm).

            ## QUY TRÌNH PHÂN TÍCH (BẮT BUỘC):

            ### BƯỚC 1: PHÂN TÍCH XU HƯỚNG (TREND ANALYSIS)
            - Xác định xu hướng tổng thể: Tăng/Ổn định/Giảm dựa trên tốc độ tăng trưởng
            - Tính toán tốc độ tăng trưởng trung bình giữa các kỳ
            - Phân tích độ biến động (volatility) của doanh thu
            - Xác định các điểm bất thường (outliers) và lý do có thể xảy ra

            ### BƯỚC 2: PHÂN TÍCH PATTERN (PATTERN IDENTIFICATION)
            - Phân tích chu kỳ theo ngày: Xác định ngày trong tuần nào có doanh thu cao/thấp
            - Phân tích theo tuần: Tìm pattern theo tuần (ví dụ: cuối tuần cao hơn)
            - Phân tích theo tháng: Xác định tháng peak/off-peak
            - Phân tích theo mùa: Nhận diện mùa bán hàng (holiday seasons, sales events)
            - Phân tích theo số lượng đơn hàng: Correlation giữa số đơn và doanh thu

            ### BƯỚC 3: TÍNH TOÁN DỰ BÁO (FORECASTING CALCULATION)
            - Sử dụng phương pháp kết hợp:
              * Trend projection: Ngoại suy xu hướng dựa trên tốc độ tăng trưởng
              * Moving average: Tính trung bình có trọng số (recent data có weight cao hơn)
              * Seasonal adjustment: Điều chỉnh theo pattern theo mùa (nếu có)
            - Công thức đề xuất:
              * predictedRevenue = averageDailyRevenue × periodDays × (1 + growthRate/100) × seasonalFactor
              * Trong đó seasonalFactor = 1.0 nếu không có pattern rõ ràng, hoặc ±0.1-0.2 dựa trên historical pattern

            ### BƯỚC 4: XÁC ĐỊNH CONFIDENCE LEVEL
            - **HIGH confidence**: 
              * Có ≥30 data points
              * Trend rõ ràng và nhất quán (growth rate ổn định)
              * Ít biến động (standard deviation < 20% của mean)
              * Pattern theo mùa rõ ràng và lặp lại
              
            - **MEDIUM confidence**:
              * Có 15-29 data points
              * Trend có nhưng có một số biến động
              * Pattern chưa rõ ràng hoàn toàn
              
            - **LOW confidence**:
              * Có <15 data points
              * Trend không rõ ràng hoặc biến động lớn
              * Không có pattern nào được xác định
              * Dữ liệu có nhiều outliers

            ### BƯỚC 5: TÍNH TOÁN RANGE (MIN/MAX)
            - **Range calculation dựa trên confidence:**
              * HIGH: ±15-20% so với predictedRevenue
              * MEDIUM: ±20-25% so với predictedRevenue
              * LOW: ±25-35% so với predictedRevenue
              
            - **Min (Pessimistic scenario)**: 
              * Xét các yếu tố tiêu cực: giảm tốc độ tăng trưởng, tăng cạnh tranh, thay đổi market
              * Tính: predictedRevenue × (1 - variance_factor)
              
            - **Max (Optimistic scenario)**:
              * Xét các yếu tố tích cực: marketing hiệu quả, seasonal boost, mở rộng customer base
              * Tính: predictedRevenue × (1 + variance_factor)

            ### BƯỚC 6: INSIGHTS & RECOMMENDATIONS
            - **Summary (2-3 câu):**
              * Tóm tắt xu hướng chính
              * Điểm nổi bật về tăng trưởng/pattern
              * Mức độ tin cậy của dự báo
              
            - **Factors (3-5 yếu tố):**
              * Yếu tố quan trọng ảnh hưởng đến dự báo
              * Phân tích cụ thể: "Doanh thu tăng X% do..."
              * Risk factors: "Cần lưu ý về..."
              
            - **Recommendations (3-5 khuyến nghị):**
              * Khuyến nghị dựa trên dữ liệu thực tế
              * Có thể thực thi (actionable)
              * Ưu tiên theo impact (high/medium/low)
              * Ví dụ: "Tăng cường marketing vào [ngày/tháng] để tận dụng pattern tăng doanh thu"

            ## YÊU CẦU VỀ OUTPUT FORMAT:
            - **BẮT BUỘC** trả về JSON hợp lệ, không có text thừa
            - Không có markdown formatting ngoài JSON structure
            - Số liệu phải là số (number), không phải string
            - confidence phải là một trong: "low" | "medium" | "high"
            - Tất cả text phải bằng tiếng Việt (trừ JSON keys)

            ## NGUYÊN TẮC QUAN TRỌNG:
            1. **Dữ liệu là thước đo**: Mọi dự báo phải dựa trên dữ liệu, không phải đoán mò
            2. **Bảo thủ hơn lạc quan**: Ưu tiên dự báo an toàn hơn là quá lạc quan
            3. **Giải thích rõ ràng**: Mọi số liệu và insight phải có lý do rõ ràng
            4. **Thực tế**: Recommendations phải khả thi và dựa trên resources có thể có
            5. **Cân nhắc rủi ro**: Luôn đề cập đến uncertainty và risk factors

            ## LƯU Ý ĐẶC BIỆT:
            - Nếu dữ liệu quá ít (<10 points), hãy đánh dấu confidence = "low" và giải thích rõ
            - Nếu xu hướng biến động lớn, hãy mở rộng range (min/max) hơn
            - Luôn xem xét correlation giữa số đơn hàng và doanh thu
            - Khi phân tích, hãy nghĩ như một CFO: cân nhắc cả opportunities và risks
        `,
        });

        // Set timeout: 30 seconds
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Gemini API timeout')), 30000);
        });

        // Call Gemini with timeout
        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise,
        ]);

        const response = result.response;
        const text = response.text();

        // Mark key as used if successful
        if (apiKey) {
          await this.keyManager.markKeyUsedByKey(apiKey).catch((err) => {
            logger.warn('Failed to mark key as used:', err);
          });
        }

        // Parse Gemini response
        return this.parseGeminiResponse(
          text,
          historicalData,
          totalRevenue,
          averageDailyRevenue,
          trend,
          growthRate,
          period,
        );
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        const isRateLimitError =
          error.code === 429 ||
          error.message?.includes('429') ||
          error.message?.includes('quota') ||
          error.message?.includes('rate limit') ||
          error.message?.includes('RESOURCE_EXHAUSTED') ||
          error.message === 'Gemini API timeout';

        // Check if it's an API key error
        const isApiKeyError =
          error.message?.includes('API_KEY') ||
          error.message?.includes('API key') ||
          error.code === 401 ||
          error.code === 403 ||
          error.message?.includes('No available Gemini API keys');

        if (isRateLimitError || isApiKeyError) {
          // Mark key as used
          if (apiKey) {
            await this.keyManager.markKeyUsedByKey(apiKey).catch((err) => {
              logger.warn('Failed to mark key as used:', err);
            });
          }

          // Try next key if available
          if (attempt < maxRetries - 1) {
            logger.warn(
              `Revenue forecast API key failed, trying next key... (attempt ${
                attempt + 1
              }/${maxRetries})`,
            );
            continue;
          }
        }

        // For other errors, log and continue to fallback
        logger.error(
          `Error getting forecast from Gemini (attempt ${attempt + 1}):`,
          {
            message: error.message,
            code: error.code,
          },
        );

        // If not rate limit error, don't retry
        if (!isRateLimitError && !isApiKeyError) {
          break;
        }
      }
    }

    // All retries failed - use fallback
    logger.warn(
      'All API keys failed for revenue forecast, using fallback calculation',
    );
    return this.generateFallbackForecast(
      period,
      totalRevenue,
      historicalData,
      averageDailyRevenue,
      trend,
      growthRate,
    );
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

    // Optimize: Only send last 15 data points instead of 30 for faster processing
    const optimizedData = historicalData.slice(-15);

    return `
Bạn là chuyên gia phân tích tài chính. Hãy phân tích dữ liệu doanh thu lịch sử và đưa ra dự báo cho ${
      periodText[period]
    }.

## DỮ LIỆU LỊCH SỬ (${optimizedData.length} điểm dữ liệu gần nhất):
${optimizedData
  .map(
    (item) =>
      `${item.date}: ${item.revenue.toLocaleString('vi-VN')} VNĐ (${
        item.count
      } đơn)`,
  )
  .join(' | ')}

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

  /**
   * Generate minimal forecast when all else fails
   */
  private generateMinimalForecast(
    period: 'week' | 'month' | 'quarter' | 'year',
  ): RevenueForecastResponse {
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + periodDays[period]);

    return {
      forecast: {
        period,
        forecastDate: forecastDate.toISOString(),
        predictedRevenue: 0,
        confidence: 'low',
        range: {
          min: 0,
          max: 0,
        },
      },
      historicalData: {
        totalRevenue: 0,
        averageDailyRevenue: 0,
        trend: 'stable',
        growthRate: 0,
        dataPoints: [],
      },
      insights: {
        summary: 'Không thể tạo dự báo do lỗi hệ thống. Vui lòng thử lại sau.',
        factors: ['Lỗi hệ thống'],
        recommendations: [
          'Thử lại sau ít phút',
          'Kiểm tra kết nối cơ sở dữ liệu',
          'Liên hệ admin nếu vấn đề vẫn tiếp diễn',
        ],
      },
      metadata: {
        analyzedDataPoints: 0,
        forecastGeneratedAt: new Date().toISOString(),
      },
    };
  }
}
