import { CategoryController } from '../controllers/category.controller';
import { Router } from 'express';

const categoryController = new CategoryController();

const router = Router();

router.get('/tree', (req, res) => categoryController.getTree(req, res));
router.post('/', (req, res) => categoryController.create(req, res));
router.put('/', (req, res) => categoryController.update(req, res));
router.delete('/', (req, res) => categoryController.delete(req, res));
router.get('/get_by_id', (req, res) => categoryController.getById(req, res));
router.get('/', (req, res) => categoryController.getAll(req, res));

export default router;
