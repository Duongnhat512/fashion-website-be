import { Category } from '../models/category.model';
import { CategoryService } from '../services/category/implements/category.service.implement';
import { Request, Response } from 'express';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { CreateCategoryRequestDto } from '../dtos/request/category/category.request';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import { ICloudService } from '../services/cloud/cloud.service.interface';
import { CloudinaryService } from '../services/cloud/implements/cloudinary.service.implement';

export class CategoryController {
  private readonly categoryService: CategoryService;
  private readonly cloudinaryService: ICloudService;

  constructor() {
    this.categoryService = new CategoryService();
    this.cloudinaryService = new CloudinaryService();
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const uploadedPublicIds: string[] = [];

    try {
      const files = (req.files as Express.Multer.File[]) || [];

      let categoryData: any;
      if (typeof req.body.categoryData === 'string') {
        try {
          categoryData = JSON.parse(req.body.categoryData);
        } catch (e) {
          res.status(400).json(
            ApiResponse.error('Invalid categoryData format', [
              {
                field: 'categoryData',
                message: ['Category data format không hợp lệ'],
              },
            ]),
          );
          return;
        }
      } else {
        categoryData = req.body;
      }

      let iconUrl = categoryData.iconUrl || '';
      const iconImageFile = files.find((f) => f.fieldname === 'iconImage');

      if (iconImageFile) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          iconImageFile,
          'fashion-website/categories',
        );
        iconUrl = uploadResult.url;
        uploadedPublicIds.push(uploadResult.publicId);
      }

      if (!iconUrl) {
        if (uploadedPublicIds.length > 0) {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
        }
        res.status(400).json(
          ApiResponse.validationError([
            {
              field: 'iconUrl',
              message: ['Icon danh mục là bắt buộc'],
            },
          ]),
        );
        return;
      }

      const category = new CreateCategoryRequestDto();
      Object.assign(category, categoryData);
      category.iconUrl = iconUrl;

      const errors = await validate(category);
      if (errors.length > 0) {
        if (uploadedPublicIds.length > 0) {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
        }

        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const newCategory = await this.categoryService.create(category);
      res.status(200).json(ApiResponse.success('Tạo danh mục', newCategory));
    } catch (error: any) {
      if (uploadedPublicIds.length > 0) {
        try {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
          console.info(
            `Rolled back ${uploadedPublicIds.length} uploaded images due to error: ${error.message}`,
          );
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded images:', cleanupError);
        }
      }

      res.status(500).json(
        ApiResponse.error('Tạo danh mục', [
          {
            field: 'createCategory',
            message: error.message || 'Tạo danh mục thất bại',
          },
        ]),
      );
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const uploadedPublicIds: string[] = [];

    try {
      const files = (req.files as Express.Multer.File[]) || [];

      let categoryData: any;
      if (typeof req.body.categoryData === 'string') {
        try {
          categoryData = JSON.parse(req.body.categoryData);
        } catch (e) {
          res.status(400).json(
            ApiResponse.error('Invalid categoryData format', [
              {
                field: 'categoryData',
                message: ['Category data format không hợp lệ'],
              },
            ]),
          );
          return;
        }
      } else {
        categoryData = req.body;
      }

      let iconUrl = categoryData.iconUrl || '';
      const iconImageFile = files.find((f) => f.fieldname === 'iconImage');

      if (iconImageFile) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          iconImageFile,
          'fashion-website/categories',
        );
        iconUrl = uploadResult.url;
        uploadedPublicIds.push(uploadResult.publicId);
      }

      const category = new Category();
      Object.assign(category, categoryData);
      if (iconUrl) {
        category.iconUrl = iconUrl;
      }

      const updatedCategory = await this.categoryService.update(category);
      res
        .status(200)
        .json(ApiResponse.success('Cập nhật danh mục', updatedCategory));
    } catch (error: any) {
      if (uploadedPublicIds.length > 0) {
        try {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
          console.info(
            `Rolled back ${uploadedPublicIds.length} uploaded images due to error: ${error.message}`,
          );
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded images:', cleanupError);
        }
      }

      res.status(500).json(
        ApiResponse.error('Cập nhật danh mục', [
          {
            field: 'updateCategory',
            message: error.message || 'Cập nhật danh mục thất bại',
          },
        ]),
      );
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.categoryService.delete(id);
      res.status(200).json(ApiResponse.success('Đã xóa danh mục'));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Xóa danh mục thất bại', [
          {
            message: 'Xóa danh mục thất bại',
            field: 'deleteCategory',
          },
        ]),
      );
    }
  }

  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getById(id);
      res.status(200).json(ApiResponse.success('Thông tin danh mục', category));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Lỗi lấy danh mục', [
          {
            field: 'getCategoryById',
            message: 'Lỗi lấy danh mục',
          },
        ]),
      );
    }
  }

  async getAllCategory(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.categoryService.getAll();
      res
        .status(200)
        .json(ApiResponse.success('Danh sách danh mục', categories));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Lỗi lấy danh mục', [
          {
            field: 'getAllCategory',
            message: 'Lỗi lấy danh mục',
          },
        ]),
      );
    }
  }

  async getCategoryTree(req: Request, res: Response): Promise<void> {
    try {
      const tree = await this.categoryService.getTree();
      res.status(200).json(ApiResponse.success('Danh sách danh mục', tree));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Lỗi lấy danh mục', [
          {
            field: 'getCategoryTree',
            message: 'Lỗi lấy danh mục',
          },
        ]),
      );
    }
  }
}
