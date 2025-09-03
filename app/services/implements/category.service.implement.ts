import {
  CategoryResponseDto,
  CategoryTreeResponseDto,
} from '../../dtos/response/category/category.response';
import { Category } from '../../models/category.model';
import { CategoryRepository } from '../../repositories/category.repository';
import { ICategoryService } from '../category.service.interface';

export class CategoryService implements ICategoryService {
  private readonly categoryRepository: CategoryRepository;
  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async create(category: Category): Promise<CategoryResponseDto> {
    const newCategory = await this.categoryRepository.create(category);
    if (!newCategory) {
      throw new Error('Failed to create category');
    }
    return newCategory;
  }

  async update(category: Category): Promise<CategoryResponseDto> {
    const updatedCategory = await this.categoryRepository.update(category);
    if (!updatedCategory) {
      throw new Error('Failed to update category');
    }
    return updatedCategory;
  }

  async delete(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  async getById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.getById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async getAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.getAll();
    if (!categories) {
      throw new Error('Failed to get all categories');
    }
    return categories;
  }

  private buildCategoryTree(
    categories: CategoryTreeResponseDto[],
  ): CategoryTreeResponseDto[] {
    const categoryMap = new Map<string, CategoryTreeResponseDto>();
    const rootCategories: CategoryTreeResponseDto[] = [];

    categories.forEach((category) => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        path: [category.name],
      });
    });

    categories.forEach((category) => {
      const categoryNode = categoryMap.get(category.id)!;

      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children?.push(categoryNode);

          categoryNode.path = [...(parent.path || []), category.name];
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    const sortCategories = (cats: CategoryTreeResponseDto[]) => {
      cats.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.position - b.position;
      });

      cats.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          sortCategories(cat.children);
        }
      });
    };

    sortCategories(rootCategories);
    return rootCategories;
  }

  async getTree(): Promise<CategoryTreeResponseDto[]> {
    const categories = await this.categoryRepository.getAll();
    return this.buildCategoryTree(categories as CategoryTreeResponseDto[]);
  }
}
