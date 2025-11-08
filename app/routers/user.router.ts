import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { uploadSingle } from '../middlewares/upload.middleware';
import { authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

router.post(
  '/register',
  router.post('/register', (req, res) => userController.createUser(req, res)),
);
router.get('/:id', (req, res) => userController.getUserById(req, res));
router.put('/update', authenticatedUser, (req, res) =>
  userController.updateUser(req, res),
);
router.post('/forgot-password', (req, res) =>
  userController.forgotPassword(req, res),
);
router.post('/reset-password', (req, res) =>
  userController.resetPassword(req, res),
);
router.post('/verify-reset-otp', (req, res) =>
  userController.verifyResetOtp(req, res),
);
router.put('/update-avt', authenticatedUser, uploadSingle, (req, res) =>
  userController.updateAvt(req, res),
);

export default router;
