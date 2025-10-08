import { Category } from '../models/category.model';
import { CategoryService } from '../services/category/implements/category.service.implement';
import { Request, Response } from 'express';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { CreateCategoryRequestDto } from '../dtos/request/category/category.request';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';

export class CategoryController {
  private readonly categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = new CreateCategoryRequestDto();
      Object.assign(category, req.body);

      const errors = await validate(category);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const newCategory = await this.categoryService.create(category);
      res.status(200).json(ApiResponse.success('Tạo danh mục', newCategory));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Tạo danh mục', [
          {
            field: 'createCategory',
            message: 'Tạo danh mục thất bại',
          },
        ]),
      );
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = new Category();
      Object.assign(category, req.body);
      const updatedCategory = await this.categoryService.update(category);
      res
        .status(200)
        .json(ApiResponse.success('Cập nhật danh mục', updatedCategory));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Cập nhật danh mục', [
          {
            field: 'updateCategory',
            message: 'Cập nhật danh mục thất bại',
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
