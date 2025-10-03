import { RequestHandler, Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { adminOnly, authenticatedUser } from '../middlewares/auth.middleware';
import { checkOrderOwnership } from '../middlewares/order.middleware';

const router = Router();
const orderController = new OrderController();

router.post('/', authenticatedUser, orderController.createOrder);
router.put('/', adminOnly, orderController.updateOrder);
router.post('/delete/:id', adminOnly, orderController.deleteOrder);
router.get('/:id', authenticatedUser, orderController.getOrderById);
router.get('/', adminOnly, orderController.getAllOrders);
router.post(
  '/cancel/:id',
  authenticatedUser,
  checkOrderOwnership as RequestHandler,
  orderController.cancelOrder,
);
router.post(
  '/mark-as-delivered',
  adminOnly,
  orderController.markOrderAsDelivered,
);
router.post(
  '/mark-as-ready-to-ship',
  adminOnly,
  orderController.markOrderReadyToShip,
);
router.post(
  '/confirm-as-completed',
  authenticatedUser,
  checkOrderOwnership as RequestHandler,
  orderController.confirmOrderAsCompleted,
);

export default router;
