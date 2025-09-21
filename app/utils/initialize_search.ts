import { ProductService } from '../services/implements/product.service.implement';

export async function initializeProductSearch(): Promise<void> {
  try {
    const productService = new ProductService();
    await productService.initializeSearchIndex();
    console.log('Product search system initialized');
  } catch (error) {
    console.error('Failed to initialize product search:', error);
  }
}
