import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.get('/login', (req, res) => authController.login(req, res));
router.post('/send-otp', (req, res) => authController.sendOtp(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOtp(req, res));

export default router;
