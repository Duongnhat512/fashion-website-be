import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { adminOnly, authenticatedUser } from '../middlewares/auth.middleware';

export const inventoryRouter = Router();

const inventoryController = new InventoryController();

inventoryRouter.get('/', adminOnly, (req, res) =>
  inventoryController.getAll(req, res),
);
inventoryRouter.get('/:id', adminOnly, (req, res) =>
  inventoryController.getById(req, res),
);
inventoryRouter.get('/warehouse/:warehouseId', adminOnly, (req, res) =>
  inventoryController.getByWarehouseId(req, res),
);
inventoryRouter.get('/variant/:variantId', authenticatedUser, (req, res) =>
  inventoryController.getByVariantId(req, res),
);
inventoryRouter.get(
  '/warehouse/:warehouseId/variant/:variantId',
  authenticatedUser,
  (req, res) => inventoryController.getByWarehouseIdAndVariantId(req, res),
);

export default inventoryRouter;
