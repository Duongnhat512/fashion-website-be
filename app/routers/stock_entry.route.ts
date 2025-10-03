import { Router } from 'express';
import { StockEntryController } from '../controllers/stock_entry.controller';
import { adminOnly } from '../middlewares/auth.middleware';

const router = Router();
const stockEntryController = new StockEntryController();

router.post('/', adminOnly, stockEntryController.createStockEntry);
router.post('/:id/submit', adminOnly, stockEntryController.submitStockEntry);
router.post('/:id/cancel', adminOnly, stockEntryController.cancelStockEntry);
router.get('/filter', adminOnly, stockEntryController.filterStockEntry);
router.put('/:id', adminOnly, stockEntryController.updateStockEntry);

export default router;
