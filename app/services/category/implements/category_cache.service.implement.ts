import redis from '../../../config/redis.config';
import { ICategoryService } from '../category.service.interface';
import { ICategoryCacheService } from '../category_cache.service.interface';
import { CategoryService } from './category.service.implement';

export class CategoryCacheService implements ICategoryCacheService {
  // Thêm các constants cho Redis keys
  private readonly CATEGORY_HIERARCHY_KEY = 'category:hierarchy';
  private readonly CATEGORY_DESCENDANTS_KEY = 'category:descendants:';
  private readonly CATEGORY_CACHE_TTL = 3600; // 1 hour

  private readonly categoryService: ICategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Cache toàn bộ category hierarchy lên Redis
   */
  async cacheCategoryHierarchy(): Promise<void> {
    try {
      const allCategories = await this.categoryService.getAll();
      const hierarchyData = {
        categories: allCategories.map((cat) => ({
          id: cat.id,
          parentId: cat.parent?.id || null,
          name: cat.name,
          slug: cat.slug,
        })),
        lastUpdated: new Date().toISOString(),
      };

      await redis.setex(
        this.CATEGORY_HIERARCHY_KEY,
        this.CATEGORY_CACHE_TTL,
        JSON.stringify(hierarchyData),
      );
    } catch (error) {
      console.error('Error caching category hierarchy:', error);
      // Không throw error để không ảnh hưởng đến chức năng chính
    }
  }

  /**
   * Lấy category hierarchy từ Redis cache
   */
  async getCachedCategoryHierarchy(): Promise<any[] | null> {
    try {
      const cached = await redis.get(this.CATEGORY_HIERARCHY_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        return data.categories;
      }
    } catch (error) {
      console.error('Error getting cached category hierarchy:', error);
    }
    return null;
  }

  /**
   * Cache kết quả descendants cho một category cụ thể
   */
  async cacheDescendants(
    categoryId: string,
    descendants: string[],
  ): Promise<void> {
    try {
      await redis.setex(
        `${this.CATEGORY_DESCENDANTS_KEY}${categoryId}`,
        this.CATEGORY_CACHE_TTL,
        JSON.stringify(descendants),
      );
    } catch (error) {
      console.error('Error caching descendants:', error);
    }
  }

  /**
   * Lấy descendants từ cache
   */
  async getCachedDescendants(categoryId: string): Promise<string[] | null> {
    try {
      const cached = await redis.get(
        `${this.CATEGORY_DESCENDANTS_KEY}${categoryId}`,
      );
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error getting cached descendants:', error);
    }
    return null;
  }

  /**
   * Tối ưu hóa hàm getDescendantCategoryIds với Redis caching
   */
  async getDescendantCategoryIds(rootId: string): Promise<string[]> {
    // 1. Kiểm tra cache cho kết quả cụ thể của rootId
    const cachedDescendants = await this.getCachedDescendants(rootId);
    if (cachedDescendants) {
      return cachedDescendants;
    }

    // 2. Lấy hierarchy từ cache hoặc database
    let categories = await this.getCachedCategoryHierarchy();

    if (!categories) {
      // Cache miss - lấy từ database và cache lại
      const allCategories = await this.categoryService.getAll();
      categories = allCategories.map((cat) => ({
        id: cat.id,
        parentId: cat.parent?.id || null,
        name: cat.name,
        slug: cat.slug,
      }));

      // Cache hierarchy cho lần sau
      await this.cacheCategoryHierarchy();
    }

    // 3. Xây dựng children map từ cached data
    const childrenMap = new Map<string, string[]>();
    for (const c of categories) {
      if (c.parentId) {
        const arr = childrenMap.get(c.parentId) || [];
        arr.push(c.id);
        childrenMap.set(c.parentId, arr);
      }
    }

    // 4. Tính toán descendants
    const result = new Set<string>([rootId]);
    const stack = [rootId];
    while (stack.length) {
      const cur = stack.pop()!;
      const kids = childrenMap.get(cur) || [];
      for (const kid of kids) {
        if (!result.has(kid)) {
          result.add(kid);
          stack.push(kid);
        }
      }
    }

    const descendants = Array.from(result);

    // 5. Cache kết quả cho lần sau
    await this.cacheDescendants(rootId, descendants);

    return descendants;
  }

  /**
   * Invalidate category cache khi có thay đổi
   */
  public async invalidateCategoryCache(): Promise<void> {
    try {
      // Xóa hierarchy cache
      await redis.del(this.CATEGORY_HIERARCHY_KEY);

      // Xóa tất cả descendants cache (sử dụng pattern matching)
      const keys = await redis.keys(`${this.CATEGORY_DESCENDANTS_KEY}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating category cache:', error);
    }
  }

  /**
   * Khởi tạo cache khi service start
   */
  async initializeCategoryCache(): Promise<void> {
    try {
      await this.cacheCategoryHierarchy();
    } catch (error) {
      console.error('Error initializing category cache:', error);
    }
  }
}
