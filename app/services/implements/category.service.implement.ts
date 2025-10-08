import { CreateCategoryRequestDto } from '../../dtos/request/category/category.request';
import {
  CategoryResponseDto,
  CategoryTreeResponseDto,
} from '../../dtos/response/category/category.response';
import { Category } from '../../models/category.model';
import { CategoryRepository } from '../../repositories/category.repository';
import { ICategoryService } from '../category.service.interface';
import slugify from 'slugify';
export class CategoryService implements ICategoryService {
  private readonly categoryRepository: CategoryRepository;
  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async create(
    category: CreateCategoryRequestDto,
  ): Promise<CategoryResponseDto> {
    const categoryData = await this.fillMissingFields(category);
    const newCategory = await this.categoryRepository.create(categoryData);

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

  private buildCategoryTree(categories: Category[]): CategoryTreeResponseDto[] {
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

      if (category.parent) {
        const parent = categoryMap.get(category.parent.id);
        if (parent) {
          parent.children?.push(categoryNode);

          categoryNode.path = [...(parent.path || []), category.name];
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  }

  async getTree(): Promise<CategoryTreeResponseDto[]> {
    const categories = await this.categoryRepository.getAll();
    return this.buildCategoryTree(categories as Category[]);
  }

  private async fillMissingFields(
    category: CreateCategoryRequestDto,
  ): Promise<CreateCategoryRequestDto> {
    const result = { ...category };

    let parent: CategoryResponseDto | null = null;
    if (category.parent?.id) {
      parent = await this.categoryRepository.getById(category.parent.id);
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    if (!result.slug) {
      let baseSlug = slugify(category.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });

      let finalSlug = baseSlug;
      let counter = 1;
      while (await this.categoryRepository.getBySlug(finalSlug)) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      result.slug = finalSlug;
    }

    result.status = result.status || 'active';
    result.layout = result.layout || 'vertical';
    result.autoGenSlug =
      result.autoGenSlug !== undefined ? result.autoGenSlug : true;
    result.autoGenSeoTitle =
      result.autoGenSeoTitle !== undefined ? result.autoGenSeoTitle : true;
    result.autoGenSeoDescription =
      result.autoGenSeoDescription !== undefined
        ? result.autoGenSeoDescription
        : true;

    return result;
  }
}
