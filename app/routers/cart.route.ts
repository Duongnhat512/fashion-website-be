import { Router } from 'express';
import { authenticatedUser } from '../middlewares/auth.middleware';
import CartController from '../controllers/cart.controller';

const router = Router();
const cartController = new CartController();

// router.post('/:userId', authenticatedUser, (req, res) =>
//   cartController.createCart(req, res),
// );

router.post('/item', authenticatedUser, (req, res) =>
  cartController.addCartItem(req, res),
);
router.post('/delete/item', authenticatedUser, (req, res) =>
  cartController.removeCartItem(req, res),
);
router.get('/', authenticatedUser, (req, res) =>
  cartController.getCart(req, res),
);
router.post('/update/item', authenticatedUser, (req, res) =>
  cartController.updateCartItem(req, res),
);
// router.post('/clear/cart', authenticatedUser, (req, res) =>
//   cartController.clearCartItems(req, res),
// );
router.post('/remove-cart-item', authenticatedUser, (req, res) =>
  cartController.removeCartItem(req, res),
);

export default router;
