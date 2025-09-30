import { Router } from 'express';
import { WarehouseController } from '../controllers/warehouse.controller';
import { adminOnly } from '../middlewares/auth.middleware';

export const warehouseRouter = Router();

const warehouseController = new WarehouseController();

warehouseRouter.post('/', adminOnly, (req, res) => {
  warehouseController.create(req, res);
});

warehouseRouter.put('/', adminOnly, (req, res) => {
  warehouseController.update(req, res);
});
