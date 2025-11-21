import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import {
  adminOnly,
  authenticatedUser,
  optionalAuth,
} from '../middlewares/auth.middleware';
import {
  uploadForImportSingle,
  uploadProductWithVariants,
  uploadSingle,
} from '../middlewares/upload.middleware';

const router = Router();
const productController = new ProductController();

router.get('/', (req, res) => productController.getAllProducts(req, res));

//Dùng phương thức này để lấy danh sách product
router.get('/search', (req, res) => productController.searchProducts(req, res));
router.get('/search/:id', optionalAuth, (req, res) =>
  productController.searchProductsByProductId(req, res),
);

// Get product recommendations for authenticated user
router.get('/recommendations', authenticatedUser, (req, res) =>
  productController.getRecommendations(req, res),
);
router.post('/', adminOnly, uploadProductWithVariants, (req, res) =>
  productController.createProduct(req, res),
);
router.put('/', adminOnly, uploadProductWithVariants, (req, res) =>
  productController.updateProduct(req, res),
);
router.post('/delete/:id', adminOnly, (req, res) =>
  productController.deleteProduct(req, res),
);

router.post('/import', adminOnly, uploadSingle, (req, res) =>
  productController.importProducts(req, res),
);

router.post('/import/products', adminOnly, uploadForImportSingle, (req, res) =>
  productController.importProductsOnly(req, res),
);

router.post('/import/variants', adminOnly, uploadForImportSingle, (req, res) =>
  productController.importVariantsOnly(req, res),
);

export default router;
