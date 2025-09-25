export const escapedCategoryId = (categoryId: string) => {
  return categoryId.replace(/-/g, '\\-');
};
