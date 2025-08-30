import { CategoryController } from '../controllers/category.controller';
import { Router } from 'express';

const categoryController = new CategoryController();

const router = Router();

router.post('/', (req, res) => categoryController.create(req, res));
router.put('/:id', (req, res) => categoryController.update(req, res));
router.delete('/:id', (req, res) => categoryController.delete(req, res));
router.get('/:id', (req, res) => categoryController.getById(req, res));
router.get('/', (req, res) => categoryController.getAll(req, res));
router.get('/tree', (req, res) => categoryController.getTree(req, res));

export default router;
