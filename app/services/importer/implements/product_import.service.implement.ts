import { Readable } from 'stream';
import csv from 'csv-parser';
import * as XLSX from 'exceljs';
import { ProductRequestDto } from '../../../dtos/request/product/product.request';
import { VariantRequestDto } from '../../../dtos/request/variant/variant.request';
import { Category } from '../../../models/category.model';
import { Color } from '../../../models/color.model';
import { Product } from '../../../models/product.model';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  data: Array<{
    product: ProductRequestDto;
    variants: VariantRequestDto[];
  }>;
}

export interface ProductOnlyResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  data: ProductRequestDto[];
}

export interface VariantOnlyResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  data: Array<{
    productId?: string;
    productSlug?: string;
    variants: VariantRequestDto[];
  }>;
}

export class ProductImportService {
  /**
   * Parse JSON file
   */
  async parseJSON(file: Express.Multer.File): Promise<ImportResult> {
    try {
      const content = file.buffer.toString('utf-8');
      const jsonData = JSON.parse(content);

      // Support both array format and object format
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      return this.processData(dataArray);
    } catch (error: any) {
      throw new Error(`Lỗi parse JSON: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(file: Express.Multer.File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(file.buffer);

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            const result = this.processData(results);
            resolve(result);
          } catch (error: any) {
            reject(new Error(`Lỗi xử lý CSV: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new Error(`Lỗi đọc CSV: ${error.message}`));
        });
    });
  }

  /**
   * Parse Excel file (.xlsx, .xls)
   */
  async parseExcel(file: Express.Multer.File): Promise<ImportResult> {
    try {
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(file.buffer as any);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('File Excel không có sheet nào');
      }

      // Convert worksheet to JSON
      const rows: any[] = [];
      const headers: string[] = [];

      // Get headers from first row
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Get data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value?.toString() || '';
          }
        });
        rows.push(rowData);
      });

      return this.processData(rows);
    } catch (error: any) {
      throw new Error(`Lỗi parse Excel: ${error.message}`);
    }
  }

  /**
   * Process parsed data and convert to DTOs
   */
  private processData(rawData: any[]): ImportResult {
    const result: ImportResult = {
      success: true,
      totalRows: rawData.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      data: [],
    };

    // Group by product (assuming products can have multiple variants in CSV/Excel)
    const productMap = new Map<string, any>();

    rawData.forEach((row, index) => {
      try {
        // Normalize field names (support multiple formats)
        const normalizedRow = this.normalizeRow(row);

        // Validate required fields
        const validationError = this.validateRow(normalizedRow, index + 1);
        if (validationError) {
          result.errors.push(validationError);
          result.errorCount++;
          return;
        }

        // Use product name + category as key to group variants
        const productKey = `${normalizedRow.productName}_${normalizedRow.categoryId}`;

        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            product: this.createProductDto(normalizedRow),
            variants: [],
          });
        }

        // Add variant if variant data exists
        if (normalizedRow.sku || normalizedRow.size || normalizedRow.colorId) {
          const variant = this.createVariantDto(normalizedRow);
          productMap.get(productKey)!.variants.push(variant);
        }

        result.successCount++;
      } catch (error: any) {
        result.errors.push({
          row: index + 1,
          message: error.message || 'Lỗi không xác định',
        });
        result.errorCount++;
      }
    });

    result.data = Array.from(productMap.values());
    result.success = result.errorCount === 0;

    return result;
  }

  /**
   * Normalize row data - handle different column name formats
   */
  private normalizeRow(row: any): any {
    const normalized: any = {};

    // Product fields
    normalized.productName =
      row.productName ||
      row['Product Name'] ||
      row['product_name'] ||
      row.name ||
      '';
    normalized.slug =
      row.slug ||
      row['Slug'] ||
      row['product_slug'] ||
      this.generateSlug(normalized.productName);
    normalized.shortDescription =
      row.shortDescription ||
      row['Short Description'] ||
      row['short_description'] ||
      row.description ||
      '';
    normalized.imageUrl =
      row.imageUrl || row['Image URL'] || row['image_url'] || row.image || '';
    normalized.brand = row.brand || row['Brand'] || row['product_brand'] || '';
    normalized.categoryId =
      row.categoryId ||
      row['Category ID'] ||
      row['category_id'] ||
      row.categoryId ||
      '';
    normalized.status =
      row.status || row['Status'] || row['product_status'] || 'active';
    normalized.tags = row.tags || row['Tags'] || row['product_tags'] || '[]';

    // Variant fields
    normalized.sku = row.sku || row['SKU'] || row['variant_sku'] || '';
    normalized.colorId =
      row.colorId || row['Color ID'] || row['color_id'] || row.colorId || '';
    normalized.size = row.size || row['Size'] || row['variant_size'] || '';
    normalized.price = row.price || row['Price'] || row['variant_price'] || 0;
    normalized.discountPrice =
      row.discountPrice ||
      row['Discount Price'] ||
      row['discount_price'] ||
      row.price ||
      0;
    normalized.discountPercent =
      row.discountPercent ||
      row['Discount Percent'] ||
      row['discount_percent'] ||
      0;
    normalized.variantImageUrl =
      row.variantImageUrl ||
      row['Variant Image URL'] ||
      row['variant_image_url'] ||
      row.variantImage ||
      normalized.imageUrl ||
      '';
    normalized.onSales =
      row.onSales || row['On Sales'] || row['on_sales'] || false;
    normalized.saleNote =
      row.saleNote || row['Sale Note'] || row['sale_note'] || '';

    return normalized;
  }

  /**
   * Validate row data
   */
  private validateRow(
    row: any,
    rowNumber: number,
  ): { row: number; message: string } | null {
    if (!row.productName) {
      return {
        row: rowNumber,
        message: 'Thiếu tên sản phẩm (productName)',
      };
    }

    if (!row.categoryId) {
      return {
        row: rowNumber,
        message: 'Thiếu category ID (categoryId)',
      };
    }

    // If variant data exists, validate variant fields
    if (row.sku || row.size || row.colorId) {
      if (!row.sku) {
        return {
          row: rowNumber,
          message: 'Thiếu SKU (sku)',
        };
      }
      if (!row.colorId) {
        return {
          row: rowNumber,
          message: 'Thiếu Color ID (colorId)',
        };
      }
      if (!row.size) {
        return {
          row: rowNumber,
          message: 'Thiếu Size (size)',
        };
      }
      if (!row.price || isNaN(Number(row.price))) {
        return {
          row: rowNumber,
          message: 'Thiếu hoặc giá không hợp lệ (price)',
        };
      }
    }

    return null;
  }

  /**
   * Create ProductRequestDto from normalized row
   */
  private createProductDto(row: any): ProductRequestDto {
    const productDto = new ProductRequestDto();

    if (row.id) {
      productDto.id = row.id;
    }

    productDto.name = row.productName;
    productDto.slug = row.slug || this.generateSlug(row.productName);
    productDto.shortDescription = row.shortDescription || '';
    productDto.imageUrl = row.imageUrl || '';
    productDto.brand = row.brand;
    productDto.category = { id: row.categoryId } as Category;
    productDto.status = row.status || 'active';
    productDto.tags = row.tags || '[]';

    return productDto;
  }

  /**
   * Create VariantRequestDto from normalized row
   */
  private createVariantDto(row: any): VariantRequestDto {
    const variantDto = new VariantRequestDto();

    if (row.id) {
      variantDto.id = row.id;
    }

    variantDto.sku = row.sku;
    variantDto.color = { id: row.colorId } as Color;
    variantDto.size = row.size;
    variantDto.price = Number(row.price);
    variantDto.discountPrice = Number(row.discountPrice || row.price);
    variantDto.discountPercent = Number(row.discountPercent || 0);
    variantDto.imageUrl = row.variantImageUrl || row.imageUrl || '';
    variantDto.onSales = Boolean(row.onSales);
    variantDto.saleNote = row.saleNote || '';
    variantDto.product = { id: row.productId } as Product;

    return variantDto;
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Parse JSON file - Products only (no variants)
   */
  async parseProductsOnlyJSON(
    file: Express.Multer.File,
  ): Promise<ProductOnlyResult> {
    try {
      const content = file.buffer.toString('utf-8');
      const jsonData = JSON.parse(content);
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      return this.processProductsOnly(dataArray);
    } catch (error: any) {
      throw new Error(`Lỗi parse JSON: ${error.message}`);
    }
  }

  /**
   * Parse CSV file - Products only
   */
  async parseProductsOnlyCSV(
    file: Express.Multer.File,
  ): Promise<ProductOnlyResult> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(file.buffer);

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            const result = this.processProductsOnly(results);
            resolve(result);
          } catch (error: any) {
            reject(new Error(`Lỗi xử lý CSV: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new Error(`Lỗi đọc CSV: ${error.message}`));
        });
    });
  }

  /**
   * Parse Excel file - Products only
   */
  async parseProductsOnlyExcel(
    file: Express.Multer.File,
  ): Promise<ProductOnlyResult> {
    try {
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('File Excel không có sheet nào');
      }

      const rows: any[] = [];
      const headers: string[] = [];

      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value?.toString() || '';
          }
        });
        rows.push(rowData);
      });

      return this.processProductsOnly(rows);
    } catch (error: any) {
      throw new Error(`Lỗi parse Excel: ${error.message}`);
    }
  }

  /**
   * Parse JSON file - Variants only
   */
  async parseVariantsOnlyJSON(
    file: Express.Multer.File,
  ): Promise<VariantOnlyResult> {
    try {
      const content = file.buffer.toString('utf-8');
      const jsonData = JSON.parse(content);
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      return this.processVariantsOnly(dataArray);
    } catch (error: any) {
      throw new Error(`Lỗi parse JSON: ${error.message}`);
    }
  }

  /**
   * Parse CSV file - Variants only
   */
  async parseVariantsOnlyCSV(
    file: Express.Multer.File,
  ): Promise<VariantOnlyResult> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(file.buffer);

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            const result = this.processVariantsOnly(results);
            resolve(result);
          } catch (error: any) {
            reject(new Error(`Lỗi xử lý CSV: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new Error(`Lỗi đọc CSV: ${error.message}`));
        });
    });
  }

  /**
   * Parse Excel file - Variants only
   */
  async parseVariantsOnlyExcel(
    file: Express.Multer.File,
  ): Promise<VariantOnlyResult> {
    try {
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(file.buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('File Excel không có sheet nào');
      }

      const rows: any[] = [];
      const headers: string[] = [];

      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value?.toString() || '';
          }
        });
        rows.push(rowData);
      });

      return this.processVariantsOnly(rows);
    } catch (error: any) {
      throw new Error(`Lỗi parse Excel: ${error.message}`);
    }
  }

  /**
   * Process products only data
   */
  private async processProductsOnly(
    rawData: any[],
  ): Promise<ProductOnlyResult> {
    const result: ProductOnlyResult = {
      success: true,
      totalRows: rawData.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      data: [],
    };

    for (let index = 0; index < rawData.length; index++) {
      const row = rawData[index];
      try {
        const normalizedRow = this.normalizeProductRow(row);
        const validationError = this.validateProductRow(
          normalizedRow,
          index + 1,
        );
        if (validationError) {
          result.errors.push(validationError);
          result.errorCount++;
          continue;
        }

        const productDto = this.createProductDto(normalizedRow);

        result.data.push(productDto);
        result.successCount++;
      } catch (error: any) {
        result.errors.push({
          row: index + 1,
          message: error.message || 'Lỗi không xác định',
        });
        result.errorCount++;
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  /**
   * Process variants only data
   */
  private async processVariantsOnly(
    rawData: any[],
  ): Promise<VariantOnlyResult> {
    const result: VariantOnlyResult = {
      success: true,
      totalRows: rawData.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      data: [],
    };

    // Group variants by product (productId or productSlug)
    const variantMap = new Map<string, any>();

    for (let index = 0; index < rawData.length; index++) {
      const row = rawData[index];
      try {
        const normalizedRow = this.normalizeVariantRow(row);
        const validationError = this.validateVariantRow(
          normalizedRow,
          index + 1,
        );

        if (validationError) {
          result.errors.push(validationError);
          result.errorCount++;
          continue;
        }

        // Use productId or productSlug as key
        const productKey =
          normalizedRow.productId || normalizedRow.productSlug || '';

        if (!variantMap.has(productKey)) {
          variantMap.set(productKey, {
            productId: normalizedRow.productId,
            productSlug: normalizedRow.productSlug,
            variants: [],
          });
        }

        const variantDto = this.createVariantDto(normalizedRow);

        variantMap.get(productKey)!.variants.push(variantDto);
        result.successCount++;
      } catch (error: any) {
        result.errors.push({
          row: index + 1,
          message: error.message || 'Lỗi không xác định',
        });
        result.errorCount++;
      }
    }

    result.data = Array.from(variantMap.values());
    result.success = result.errorCount === 0;

    return result;
  }

  /**
   * Normalize product row (only product fields)
   */
  private normalizeProductRow(row: any): any {
    return {
      id: row.id || row['ID'] || row['product_id'] || '',
      productName:
        row.productName ||
        row['Product Name'] ||
        row['product_name'] ||
        row.name ||
        '',
      slug:
        row.slug ||
        row['Slug'] ||
        row['product_slug'] ||
        this.generateSlug(row.productName || row.name || ''),
      shortDescription:
        row.shortDescription ||
        row['Short Description'] ||
        row['short_description'] ||
        row.description ||
        '',
      imageUrl:
        row.imageUrl || row['Image URL'] || row['image_url'] || row.image || '',
      brand: row.brand || row['Brand'] || row['product_brand'] || '',
      categoryId:
        row.categoryId || row['Category ID'] || row['category_id'] || '',
      status: row.status || row['Status'] || row['product_status'] || 'active',
      tags: row.tags || row['Tags'] || row['product_tags'] || '[]',
    };
  }

  /**
   * Normalize variant row (only variant fields + product reference)
   */
  private normalizeVariantRow(row: any): any {
    return {
      id: row.id,
      // Product reference (one of these is required)
      productId: row.productId || row['Product ID'] || row['product_id'] || '',
      productSlug:
        row.productSlug || row['Product Slug'] || row['product_slug'] || '',
      productName:
        row.productName || row['Product Name'] || row['product_name'] || '',

      // Variant fields
      sku: row.sku || row['SKU'] || row['variant_sku'] || '',
      colorId: row.colorId || row['Color ID'] || row['color_id'] || '',
      size: row.size || row['Size'] || row['variant_size'] || '',
      price: row.price || row['Price'] || row['variant_price'] || 0,
      discountPrice:
        row.discountPrice ||
        row['Discount Price'] ||
        row['discount_price'] ||
        row.price ||
        0,
      discountPercent:
        row.discountPercent ||
        row['Discount Percent'] ||
        row['discount_percent'] ||
        0,
      variantImageUrl:
        row.variantImageUrl ||
        row['Variant Image URL'] ||
        row['variant_image_url'] ||
        row.variantImage ||
        '',
      onSales: row.onSales || row['On Sales'] || row['on_sales'] || false,
      saleNote: row.saleNote || row['Sale Note'] || row['sale_note'] || '',
    };
  }

  /**
   * Validate product row
   */
  private validateProductRow(
    row: any,
    rowNumber: number,
  ): { row: number; message: string } | null {
    if (!row.productName) {
      return { row: rowNumber, message: 'Thiếu tên sản phẩm (productName)' };
    }
    if (!row.categoryId) {
      return {
        row: rowNumber,
        message: `Thiếu category ID (categoryId), productName: ${row.productName}, row: ${rowNumber}`,
      };
    }

    return null;
  }

  /**
   * Validate variant row
   */
  private validateVariantRow(
    row: any,
    rowNumber: number,
  ): { row: number; message: string } | null {
    // Must have at least one product reference
    if (!row.productId && !row.productSlug && !row.productName) {
      return {
        row: rowNumber,
        message: 'Thiếu productId, productSlug hoặc productName',
      };
    }

    if (!row.sku) {
      return { row: rowNumber, message: 'Thiếu SKU (sku)' };
    }
    if (!row.colorId) {
      return { row: rowNumber, message: 'Thiếu Color ID (colorId)' };
    }
    if (!row.size) {
      return { row: rowNumber, message: 'Thiếu Size (size)' };
    }
    if (!row.price || isNaN(Number(row.price))) {
      return { row: rowNumber, message: 'Thiếu hoặc giá không hợp lệ (price)' };
    }
    return null;
  }
}
