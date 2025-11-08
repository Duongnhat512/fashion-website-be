import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../../config/env';
import { ICloudService } from '../cloud.service.interface';
import logger from '../../../utils/logger';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export class CloudinaryService implements ICloudService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'fashion-website',
  ): Promise<{ url: string; publicId: string }> {
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'image',
            transformation: {
              fetch_format: 'auto',
              quality: 'auto',
            },
          },
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            } else {
              reject(new Error('Upload failed: No result returned'));
            }
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      logger.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'fashion-website',
  ): Promise<Array<{ url: string; publicId: string }>> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error uploading multiple images to Cloudinary:', error);
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted image from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      await Promise.all(publicIds.map((id) => this.deleteImage(id)));
    } catch (error) {
      logger.error('Error deleting multiple images from Cloudinary:', error);
      throw error;
    }
  }
}
