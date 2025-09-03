import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();
const productController = new ProductController();

router.get('/', (req, res) => productController.getAllProducts(req, res));

router.get('/search', (req, res) => productController.searchProducts(req, res));

router.get('/filter', (req, res) => productController.filterProducts(req, res));

router.post('/', (req, res) => productController.createProduct(req, res));

export default router;
