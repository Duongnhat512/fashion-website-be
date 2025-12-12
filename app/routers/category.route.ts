import { CategoryController } from '../controllers/category.controller';
import { Router } from 'express';
import { uploadSingle } from '../middlewares/upload.middleware';
import { adminOnly } from '../middlewares/auth.middleware';

const categoryController = new CategoryController();

const router = Router();

router.get('/tree', (req, res) => categoryController.getCategoryTree(req, res));
router.post('/', adminOnly, uploadSingle, (req, res) => categoryController.createCategory(req, res));
router.put('/', adminOnly, uploadSingle, (req, res) => categoryController.updateCategory(req, res));
router.post('/delete/:id', adminOnly, (req, res) =>
  categoryController.deleteCategory(req, res),
);
router.get('/get-by-id', (req, res) =>
  categoryController.getCategoryById(req, res),
);
router.get('/', (req, res) => categoryController.getAllCategory(req, res));

export default router;
