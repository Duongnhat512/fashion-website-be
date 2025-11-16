import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { adminOnly, authenticatedUser } from '../middlewares/auth.middleware';
import { uploadMultiple } from '../middlewares/upload.middleware';

const router = Router();
const reviewController = new ReviewController();

router.get('/product/:productId', (req, res) =>
  reviewController.getReviewsByProductId(req, res),
);
router.get('/', adminOnly, (req, res) => reviewController.getAllReviews(req, res));
router.get('/:id', (req, res) => reviewController.getReviewById(req, res));

router.post('/', authenticatedUser, uploadMultiple, (req, res) =>
  reviewController.createReview(req, res),
);
router.post('/merge', authenticatedUser, (req, res) =>
  reviewController.mergeReviews(req, res),
);
router.put('/:id', authenticatedUser, uploadMultiple, (req, res) =>
  reviewController.updateReview(req, res),
);
router.delete('/:id', authenticatedUser, (req, res) =>
  reviewController.deleteReview(req, res),
);

export default router;
