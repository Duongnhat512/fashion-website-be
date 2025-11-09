import { Router } from 'express';
import { ColorController } from '../controllers/color.controller';

const router = Router();
const controller = new ColorController();

router.get('/', controller.getColors);

export default router;
