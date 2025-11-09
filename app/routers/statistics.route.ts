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
router.get('/orders', adminOnly, statisticsController.getOrderStatistics);

export default router;