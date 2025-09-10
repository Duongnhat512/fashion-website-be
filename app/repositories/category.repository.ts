import {
  CategoryResponseDto,
  CategoryTreeResponseDto,
} from '../dtos/response/category/category.response';
import { Category } from '../models/category.model';
import { IsNull, Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';

export class CategoryRepository {
  private readonly categoryRepository: Repository<Category>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async create(category: Category): Promise<CategoryResponseDto> {
    const newCategory = await this.categoryRepository.save(category);
    if (!newCategory) {
      throw new Error('Failed to create category');
    }
    return newCategory;
  }

  async update(category: Category): Promise<CategoryResponseDto> {
    await this.categoryRepository.update(category.id, category);
    return this.getById(category.id);
  }

  async delete(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  async getById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async getAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find();
    if (!categories) {
      throw new Error('Failed to get all categories');
    }
    return categories;
  }
}
