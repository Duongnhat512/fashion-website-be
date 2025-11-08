import multer from 'multer';
import { securityConfig } from '../config/security.config';

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (securityConfig.fileUpload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${securityConfig.fileUpload.allowedTypes.join(
          ', ',
        )}`,
      ),
    );
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: securityConfig.fileUpload.maxSize,
  },
});

export const uploadSingle = upload.any();

export const uploadMultiple = upload.array('images', 10);

export const uploadProductWithVariants = upload.any();
