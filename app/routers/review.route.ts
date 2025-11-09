import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const reviewController = new ReviewController();

router.get('/product/:productId', (req, res) =>
  reviewController.getReviewsByProductId(req, res),
);
router.get('/:id', (req, res) => reviewController.getReviewById(req, res));

router.post('/', authenticatedUser, (req, res) =>
  reviewController.createReview(req, res),
);
router.put('/:id', authenticatedUser, (req, res) =>
  reviewController.updateReview(req, res),
);
router.delete('/:id', authenticatedUser, (req, res) =>
  reviewController.deleteReview(req, res),
);

export default router;
