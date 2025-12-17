import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';
import { authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const addressController = new AddressController();

// All routes require authentication
router.use(authenticatedUser);

// Get all addresses for the authenticated user
router.get('/', (req, res) => addressController.getAddressesByUserId(req, res));

// Get address by ID
router.get('/:id', (req, res) => addressController.getAddressById(req, res));

// Create new address
router.post('/', (req, res) => addressController.createAddress(req, res));

// Update address
router.put('/:id', (req, res) => addressController.updateAddress(req, res));

// Delete address
router.delete('/:id', (req, res) => addressController.deleteAddress(req, res));

// Set default address
router.patch('/:id/set-default', (req, res) =>
  addressController.setDefaultAddress(req, res),
);

export default router;

