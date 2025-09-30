import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { adminOnly } from '../middlewares/auth.middleware';

const router = Router();
const productController = new ProductController();

router.get('/', (req, res) => productController.getAllProducts(req, res));
router.get('/search', (req, res) => productController.searchProducts(req, res));
router.get('/filter', (req, res) => productController.filterProducts(req, res));
router.post('/', adminOnly, (req, res) =>
  productController.createProduct(req, res),
);
router.put('/', adminOnly, (req, res) =>
  productController.updateProduct(req, res),
);
router.post('/delete', adminOnly, (req, res) =>
  productController.deleteProduct(req, res),
);

export default router;
