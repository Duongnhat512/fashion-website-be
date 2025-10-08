import { CategoryResponseDto } from '../dtos/response/category/category.response';
import { Category } from '../models/category.model';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { CreateCategoryRequestDto } from '../dtos/request/category/category.request';

export class CategoryRepository {
  private readonly categoryRepository: Repository<Category>;

  constructor() {
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async create(
    category: CreateCategoryRequestDto,
  ): Promise<CategoryResponseDto> {
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
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        parent: true,
        children: true,
      },
    });
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async getAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      relations: {
        parent: true,
        children: true,
      },
    });
    if (!categories) {
      throw new Error('Failed to get all categories');
    }
    return categories;
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { slug },
    });
  }

  async getChildrenCount(parentId: string | null): Promise<number> {
    return await this.categoryRepository.count({
      where: { parent: parentId ? { id: parentId } : undefined },
    });
  }
}
