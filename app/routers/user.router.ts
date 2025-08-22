import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/implements/user.service.implement';

const router = Router();
const userController = new UserController();

router.post(
  '/register',
  router.post('/register', (req, res) => userController.createUser(req, res)),
);

router.get('/login', (req, res) => userController.login(req, res));

router.get('/:id', (req, res) => userController.getUserById(req, res));

export default router;
