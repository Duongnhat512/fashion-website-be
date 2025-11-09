import { Request, Response } from 'express';
import { CloudinaryService } from '../services/cloud/implements/cloudinary.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ICloudService } from '../services/cloud/cloud.service.interface';

export class UploadController {
  private readonly cloudinaryService: ICloudService;

  constructor() {
    this.cloudinaryService = new CloudinaryService();
  }

  async uploadSingleImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json(
          ApiResponse.error('Upload hình ảnh', [
            {
              field: 'image',
              message: ['Vui lòng chọn một hình ảnh để upload'],
            },
          ]),
        );
      }

      const { folder } = req.body;
      const result = await this.cloudinaryService.uploadImage(
        req.file,
        folder || 'fashion-website/products',
      );

      res.status(200).json(
        ApiResponse.success('Upload hình ảnh thành công', {
          url: result.url,
          publicId: result.publicId,
        }),
      );
    } catch (error: any) {
      res.status(500).json(
        ApiResponse.error('Upload hình ảnh', [
          {
            field: 'upload',
            message: [error.message || 'Upload hình ảnh thất bại'],
          },
        ]),
      );
    }
  }

  async uploadMultipleImages(req: Request, res: Response) {
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        return res.status(400).json(
          ApiResponse.error('Upload hình ảnh', [
            {
              field: 'images',
              message: ['Vui lòng chọn ít nhất một hình ảnh để upload'],
            },
          ]),
        );
      }

      const files = Array.isArray(req.files) ? req.files : [req.files];
      const { folder } = req.body;

      const results = await this.cloudinaryService.uploadMultipleImages(
        files as Express.Multer.File[],
        folder || 'fashion-website/products',
      );

      res
        .status(200)
        .json(ApiResponse.success('Upload hình ảnh thành công', results));
    } catch (error: any) {
      res.status(500).json(
        ApiResponse.error('Upload hình ảnh', [
          {
            field: 'upload',
            message: [error.message || 'Upload hình ảnh thất bại'],
          },
        ]),
      );
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json(
          ApiResponse.error('Xóa hình ảnh', [
            {
              field: 'publicId',
              message: ['Vui lòng cung cấp publicId của hình ảnh'],
            },
          ]),
        );
      }

      await this.cloudinaryService.deleteImage(publicId);

      res
        .status(200)
        .json(ApiResponse.success('Xóa hình ảnh thành công', null));
    } catch (error: any) {
      res.status(500).json(
        ApiResponse.error('Xóa hình ảnh', [
          {
            field: 'delete',
            message: [error.message || 'Xóa hình ảnh thất bại'],
          },
        ]),
      );
    }
  }
}
