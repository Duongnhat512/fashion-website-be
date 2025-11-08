import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { adminOnly } from '../middlewares/auth.middleware';
import { uploadProductWithVariants } from '../middlewares/upload.middleware';

const router = Router();
const productController = new ProductController();

router.get('/', (req, res) => productController.getAllProducts(req, res));

//Dùng phương thức này để lấy danh sách product
router.get('/search', (req, res) => productController.searchProducts(req, res));
router.post('/', adminOnly, uploadProductWithVariants, (req, res) =>
  productController.createProduct(req, res),
);
router.put('/', adminOnly, uploadProductWithVariants, (req, res) =>
  productController.updateProduct(req, res),
);
router.get('/:id', adminOnly, (req, res) => productController.getProductById(req, res));
router.post('/delete/:id', adminOnly, (req, res) =>
  productController.deleteProduct(req, res),
);



export default router;
