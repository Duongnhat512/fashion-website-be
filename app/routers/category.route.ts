import { CategoryController } from '../controllers/category.controller';
import { Router } from 'express';

const categoryController = new CategoryController();

const router = Router();

router.get('/tree', (req, res) => categoryController.getCategoryTree(req, res));
router.post('/', (req, res) => categoryController.createCategory(req, res));
router.put('/', (req, res) => categoryController.updateCategory(req, res));
router.post('/delete/:id', (req, res) =>
  categoryController.deleteCategory(req, res),
);
router.get('/get-by-id', (req, res) =>
  categoryController.getCategoryById(req, res),
);
router.get('/', (req, res) => categoryController.getAllCategory(req, res));

export default router;
