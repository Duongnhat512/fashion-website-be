import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { adminOnly, authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const orderController = new OrderController();

router.post('/', authenticatedUser, orderController.createOrder);
router.put('/', adminOnly, orderController.updateOrder);
router.post('/delete/:id', adminOnly, orderController.deleteOrder);
router.get('/:id', authenticatedUser, orderController.getOrderById);
router.get('/', adminOnly, orderController.getAllOrders);

export default router;
