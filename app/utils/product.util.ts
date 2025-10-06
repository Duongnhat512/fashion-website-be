export const escapedCategoryId = (categoryId: string) => {
  return categoryId.replace(/-/g, '\\-');
};

export const normalizeText = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, ' ')
    .trim();
};
