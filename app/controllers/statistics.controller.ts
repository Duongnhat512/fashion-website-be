import { Request, Response } from 'express';
import { IStatisticsService } from '../services/statistics/statistics.service.interface';
import { StatisticsService } from '../services/statistics/implements/statistics.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';

export class StatisticsController {
  private readonly statisticsService: IStatisticsService;

  constructor() {
    this.statisticsService = new StatisticsService();
  }

  // Dashboard tổng quan
  getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.statisticsService.getDashboardStats(start, end);
      res.status(200).json(ApiResponse.success('Thống kê tổng quan', stats));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Tổng doanh thu
  getTotalRevenue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const revenue = await this.statisticsService.getTotalRevenue(start, end);
      res.status(200).json(ApiResponse.success('Tổng doanh thu', { revenue }));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Doanh thu theo trạng thái
  getRevenueByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const revenue = await this.statisticsService.getRevenueByStatus(
        start,
        end,
      );
      res
        .status(200)
        .json(
          ApiResponse.success('Doanh thu theo trạng thái đơn hàng', revenue),
        );
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Doanh thu theo thời gian (cho biểu đồ)
  getRevenueTimeSeries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      if (
        period &&
        !['day', 'week', 'month', 'year'].includes(period as string)
      ) {
        res
          .status(400)
          .json(
            ApiResponse.error('Period phải là: day, week, month hoặc year'),
          );
        return;
      }

      const timeSeries = await this.statisticsService.getRevenueTimeSeries(
        (period as 'day' | 'week' | 'month' | 'year') || 'day',
        start,
        end,
      );
      res
        .status(200)
        .json(ApiResponse.success('Doanh thu theo thời gian', timeSeries));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Top sản phẩm bán chạy
  getTopSellingProducts = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { limit, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const limitNum = limit ? parseInt(limit as string) : 10;

      const products = await this.statisticsService.getTopSellingProducts(
        limitNum,
        start,
        end,
      );
      res
        .status(200)
        .json(ApiResponse.success('Top sản phẩm bán chạy', products));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Thống kê sản phẩm
  getProductStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.statisticsService.getProductStatistics(
        start,
        end,
      );
      res.status(200).json(ApiResponse.success('Thống kê sản phẩm', stats));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Thống kê đơn hàng
  getOrderStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.statisticsService.getOrderStatistics(start, end);
      res.status(200).json(ApiResponse.success('Thống kê đơn hàng', stats));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Chi tiết bán hàng sản phẩm
  getProductSalesDetail = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.statisticsService.getProductSalesDetail(
        start,
        end,
      );
      res
        .status(200)
        .json(ApiResponse.success('Chi tiết bán hàng sản phẩm', stats));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Top sản phẩm theo doanh thu
  getTopProductsByRevenue = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { limit, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const limitNum = limit ? parseInt(limit as string) : 10;

      const products = await this.statisticsService.getTopProductsByRevenue(
        limitNum,
        start,
        end,
      );
      res
        .status(200)
        .json(ApiResponse.success('Top sản phẩm theo doanh thu', products));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Top sản phẩm theo lượt xem
  getTopProductsByViews = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { limit, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const limitNum = limit ? parseInt(limit as string) : 10;

      const products = await this.statisticsService.getTopProductsByViews(
        limitNum,
        start,
        end,
      );
      res
        .status(200)
        .json(ApiResponse.success('Top sản phẩm theo lượt xem', products));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Doanh thu theo giờ
  getRevenueHourlySeries = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const series = await this.statisticsService.getRevenueHourlySeries(
        start,
        end,
      );
      res.status(200).json(ApiResponse.success('Doanh thu theo giờ', series));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // So sánh doanh thu
  getRevenueComparison = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.query;
      const compareDate = date ? new Date(date as string) : new Date(); // Mặc định hôm nay

      const comparison = await this.statisticsService.getRevenueComparison(
        compareDate,
      );
      res
        .status(200)
        .json(ApiResponse.success('So sánh doanh thu', comparison));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Profit time series
  getProfitTimeSeries = async (req: Request, res: Response): Promise<void> => {
    try {
      const { period, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      if (
        period &&
        !['day', 'week', 'month', 'year', 'hour'].includes(period as string)
      ) {
        res
          .status(400)
          .json(
            ApiResponse.error(
              'Period phải là: day, week, month, year hoặc hour',
            ),
          );
        return;
      }

      const timeSeries = await this.statisticsService.getProfitTimeSeries(
        (period as 'day' | 'week' | 'month' | 'year' | 'hour') || 'day',
        start,
        end,
      );
      res
        .status(200)
        .json(ApiResponse.success('Profit theo thời gian', timeSeries));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  // Revenue forecast using AI
  generateRevenueForecast = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { period, startDate, endDate } = req.query;

      // Validate period
      if (
        period &&
        !['week', 'month', 'quarter', 'year'].includes(period as string)
      ) {
        res
          .status(400)
          .json(
            ApiResponse.error(
              'Period phải là: week, month, quarter hoặc year',
            ),
          );
        return;
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const forecast = await this.statisticsService.generateRevenueForecast(
        (period as 'week' | 'month' | 'quarter' | 'year') || 'month',
        start,
        end,
      );

      res
        .status(200)
        .json(ApiResponse.success('Dự báo doanh thu', forecast));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };
}
