import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

router.post(
  '/create-payment-url',
  authenticatedUser,
  paymentController.createPaymentUrl,
);
router.get('/vnpay-redirect', paymentController.handleVNPayRedirect);

export default router;
