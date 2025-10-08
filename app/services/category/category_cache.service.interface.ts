export interface ICategoryCacheService {
  cacheCategoryHierarchy(): Promise<void>;
  getCachedCategoryHierarchy(): Promise<any[] | null>;
  cacheDescendants(categoryId: string, descendants: string[]): Promise<void>;
  getCachedDescendants(categoryId: string): Promise<string[] | null>;
  getDescendantCategoryIds(rootId: string): Promise<string[]>;
  invalidateCategoryCache(): Promise<void>;
  initializeCategoryCache(): Promise<void>;
}
