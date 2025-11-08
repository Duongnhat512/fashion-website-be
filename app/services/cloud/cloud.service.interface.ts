export interface ICloudService {
    uploadImage(
      file: Express.Multer.File,
      folder?: string,
    ): Promise<{ url: string; publicId: string }>;
    uploadMultipleImages(
      files: Express.Multer.File[],
      folder?: string,
    ): Promise<Array<{ url: string; publicId: string }>>;
    deleteImage(publicId: string): Promise<void>;
    deleteMultipleImages(publicIds: string[]): Promise<void>;
  }