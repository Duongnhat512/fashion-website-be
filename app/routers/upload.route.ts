import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware';
import { adminOnly } from '../middlewares/auth.middleware';

const router = Router();
const uploadController = new UploadController();

// Upload single image
router.post(
  '/single',
  adminOnly,
  uploadSingle,
  (req, res) => uploadController.uploadSingleImage(req, res),
);

// Upload multiple images
router.post(
  '/multiple',
  adminOnly,
  uploadMultiple,
  (req, res) => uploadController.uploadMultipleImages(req, res),
);

// Delete image
router.delete(
  '/',
  adminOnly,
  (req, res) => uploadController.deleteImage(req, res),
);

export default router;