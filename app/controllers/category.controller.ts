import { Category } from '../models/category.model';
import { CategoryService } from '../services/implements/category.service.implement';
import {
  CategoryResponseDto,
  CategoryTreeResponseDto,
} from '../dtos/response/category/category.response';
import { Request, Response } from 'express';
import { ApiResponse } from '../dtos/response/api.response.dto';

export class CategoryController {
  private readonly categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  async create(req: Request, res: Response): Promise<void> {
    const category = new Category();
    Object.assign(category, req.body);
    const newCategory = await this.categoryService.create(category);
    res.status(200).json(ApiResponse.success('Create category', newCategory));
  }

  async update(req: Request, res: Response): Promise<void> {
    const category = new Category();
    Object.assign(category, req.body);
    const updatedCategory = await this.categoryService.update(category);
    res
      .status(200)
      .json(ApiResponse.success('Update category', updatedCategory));
  }

  async delete(req: Request, res: Response): Promise<void> {
    await this.categoryService.delete(req.params.id);
    res.status(200).json(ApiResponse.success('Delete category'));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const category = await this.categoryService.getById(req.params.id);
    res.status(200).json(ApiResponse.success('Get category by id', category));
  }

  async getAll(req: Request, res: Response): Promise<void> {
    const categories = await this.categoryService.getAll();
    res.status(200).json(ApiResponse.success('Get all categories', categories));
  }

  async getTree(req: Request, res: Response): Promise<void> {
    const tree = await this.categoryService.getTree();
    res.status(200).json(ApiResponse.success('Get tree categories', tree));
  }
}
