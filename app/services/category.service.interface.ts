import {
  CategoryResponseDto,
  CategoryTreeResponseDto,
} from '../dtos/response/category/category.response';
import { Category } from '../models/category.model';

export interface ICategoryService {
  create(category: Category): Promise<CategoryResponseDto>;
  update(category: Category): Promise<CategoryResponseDto>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<CategoryResponseDto>;
  getAll(): Promise<CategoryResponseDto[]>;
  getTree(): Promise<CategoryTreeResponseDto[]>;
}
