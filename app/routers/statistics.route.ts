import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';
import { adminOnly } from '../middlewares/auth.middleware';

const router = Router();
const statisticsController = new StatisticsController();

// Tất cả routes chỉ dành cho admin
router.get('/dashboard', adminOnly, statisticsController.getDashboardStats);
router.get('/revenue', adminOnly, statisticsController.getTotalRevenue);
router.get(
  '/revenue/by-status',
  adminOnly,
  statisticsController.getRevenueByStatus,
);
router.get(
  '/revenue/time-series',
  adminOnly,
  statisticsController.getRevenueTimeSeries,
);
router.get(
  '/products/top-selling',
  adminOnly,
  statisticsController.getTopSellingProducts,
);
router.get(
  '/products/statistics',
  adminOnly,
  statisticsController.getProductStatistics,
);
router.get(
  '/products/sales-detail',
  adminOnly,
  statisticsController.getProductSalesDetail,
);
router.get(
  '/products/top-by-revenue',
  adminOnly,
  statisticsController.getTopProductsByRevenue,
);
router.get(
  '/products/top-by-views',
  adminOnly,
  statisticsController.getTopProductsByViews,
);
router.get(
  '/revenue/hourly',
  adminOnly,
  statisticsController.getRevenueHourlySeries,
);
router.get(
  '/revenue/comparison',
  adminOnly,
  statisticsController.getRevenueComparison,
);
router.get(
  '/profit/time-series',
  adminOnly,
  statisticsController.getProfitTimeSeries,
);

router.get('/orders', adminOnly, statisticsController.getOrderStatistics);

export default router;
