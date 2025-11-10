import {
  ImportResult,
  ProductOnlyResult,
  VariantOnlyResult,
} from './implements/product_import.service.implement';

export interface IImportService {
  parseJSON(file: Express.Multer.File): Promise<ImportResult>;
  parseCSV(file: Express.Multer.File): Promise<ImportResult>;
  parseExcel(file: Express.Multer.File): Promise<ImportResult>;

  parseProductsOnlyJSON(file: Express.Multer.File): Promise<ProductOnlyResult>;
  parseProductsOnlyCSV(file: Express.Multer.File): Promise<ProductOnlyResult>;
  parseProductsOnlyExcel(file: Express.Multer.File): Promise<ProductOnlyResult>;

  parseVariantsOnlyJSON(file: Express.Multer.File): Promise<VariantOnlyResult>;
  parseVariantsOnlyCSV(file: Express.Multer.File): Promise<VariantOnlyResult>;
  parseVariantsOnlyExcel(file: Express.Multer.File): Promise<VariantOnlyResult>;
}
