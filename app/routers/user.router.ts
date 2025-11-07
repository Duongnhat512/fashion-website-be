import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

router.post(
  '/register',
  router.post('/register', (req, res) => userController.createUser(req, res)),
);
router.get('/:id', (req, res) => userController.getUserById(req, res));
router.put('/update', (req, res) => userController.updateUser(req, res));
router.post('/forgot-password', (req, res) => userController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => userController.resetPassword(req, res));
router.post('/verify-reset-otp', (req, res) => userController.verifyResetOtp(req, res));

export default router;
