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

export function removeSearchFields(product: any): any {
  if (!product) return product;

  const searchFields = [
    'embedding',
    'shortDescriptionNormalized',
    'nameNormalized',
    'brandNormalized',
    'tagsNormalized',
    'searchContent',
  ];

  const cleaned = { ...product };
  searchFields.forEach((field) => {
    delete cleaned[field];
  });

  return cleaned;
}

export function removeSearchFieldsFromProducts(products: any[]): any[] {
  return products.map((product) => removeSearchFields(product));
}
