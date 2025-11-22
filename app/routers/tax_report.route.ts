import { Router } from 'express';
import { TaxReportController } from '../controllers/tax_report.controller';
import { adminOnly } from '../middlewares/auth.middleware';

const taxReportRouter = Router();
const taxReportController = new TaxReportController();

// Chỉ cho phép Admin truy cập báo cáo thuế

// VAT Report Routes
taxReportRouter.get('/vat', adminOnly, taxReportController.getVatReport);
taxReportRouter.get(
  '/vat/export',
  adminOnly,
  taxReportController.exportVatReport,
);

// CIT Report Routes
taxReportRouter.get('/cit', adminOnly, taxReportController.getCitReport);
taxReportRouter.get(
  '/cit/export',
  adminOnly,
  taxReportController.exportCitReport,
);

// Financial Report Routes
taxReportRouter.get(
  '/financial',
  adminOnly,
  taxReportController.getFinancialReport,
);
taxReportRouter.get(
  '/financial/export',
  adminOnly,
  taxReportController.exportFinancialReport,
);

export default taxReportRouter;
