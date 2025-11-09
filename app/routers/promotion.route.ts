import { Router } from 'express';
import { PromotionController } from '../controllers/promotion.controller';
import { adminOnly } from '../middlewares/auth.middleware';

const router = Router();
const controller = new PromotionController();

router.post('/', adminOnly, (req, res) => controller.create(req, res));
router.put('/:id', adminOnly, (req, res) => controller.update(req, res));
router.delete('/:id', adminOnly, (req, res) => controller.delete(req, res));
router.get('/:id', adminOnly, (req, res) => controller.getById(req, res));
router.get('/', adminOnly, (req, res) => controller.getPromotions(req, res));
router.post('/:id/activate', adminOnly, (req, res) =>
  controller.activate(req, res),
);
router.post('/:id/deactivate', adminOnly, (req, res) =>
  controller.deactivate(req, res),
);

export default router;
