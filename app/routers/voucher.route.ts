import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { adminOnly, authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const controller = new VoucherController();

router.get('/', authenticatedUser, (req, res) => {
  controller.getVouchers(req, res);
});
router.get('/:id', authenticatedUser, (req, res) => {
  controller.getVoucherById(req, res);
});
router.post('/', adminOnly, (req, res) => {
  controller.createVoucher(req, res);
});
router.put('/:id', adminOnly, (req, res) => {
  controller.updateVoucher(req, res);
});
router.delete('/:id', adminOnly, (req, res) => {
  controller.deleteVoucher(req, res);
});
router.patch('/:id/toggle', adminOnly, (req, res) => {
  controller.toggleVoucher(req, res);
});

export default router;
