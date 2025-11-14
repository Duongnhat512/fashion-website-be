import { RequestHandler, Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { InvoiceController } from '../controllers/invoice.controller';
import { adminOnly, authenticatedUser } from '../middlewares/auth.middleware';
import { checkOrderOwnership } from '../middlewares/order.middleware';

const router = Router();
const orderController = new OrderController();
const invoiceController = new InvoiceController();

router.post('/', authenticatedUser, orderController.createOrder);
router.put('/', adminOnly, orderController.updateOrder);
router.post('/delete/:id', adminOnly, orderController.deleteOrder);
router.get('/', adminOnly, orderController.getAllOrders);

router.get('/:id', authenticatedUser, orderController.getOrderById);
router.post(
  '/cancel/:id',
  authenticatedUser,
  checkOrderOwnership as RequestHandler,
  orderController.cancelOrder,
);
router.post(
  '/mark-as-delivered/:id',
  adminOnly,
  orderController.markOrderAsDelivered,
);
router.post(
  '/mark-as-ready-to-ship/:id',
  adminOnly,
  orderController.markOrderReadyToShip,
);
router.post(
  '/confirm-as-completed/:id',
  authenticatedUser,
  checkOrderOwnership as RequestHandler,
  orderController.confirmOrderAsCompleted,
);

router.post(
  '/mark-as-shipping/:id',
  adminOnly,
  orderController.markOrderAsShipping,
);

router.get(
  '/user/:userId',
  authenticatedUser,
  orderController.getOrdersByUserId,
);

router.get(
  '/:id/invoice',
  authenticatedUser,
  checkOrderOwnership as RequestHandler,
  invoiceController.generateInvoice,
);
router.get(
  '/:id/invoice/download',
  authenticatedUser,
  checkOrderOwnership as RequestHandler,
  invoiceController.downloadInvoice,
);
router.get(
  '/invoices/batch',
  authenticatedUser,
  invoiceController.generateBatchInvoices,
);

router.get(
  '/invoices/batch/download',
  authenticatedUser,
  invoiceController.downloadBatchInvoices,
);

export default router;
