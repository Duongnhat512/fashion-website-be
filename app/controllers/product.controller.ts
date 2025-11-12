import { Request, Response } from 'express';
import { IProductService } from '../services/product/product.service.interface';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ProductService } from '../services/product/implements/product.service.implement';
import {
  ProductRequestDto,
  UpdateProductRequestDto,
} from '../dtos/request/product/product.request';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import {
  UpdateVariantRequestDto,
  VariantRequestDto,
} from '../dtos/request/variant/variant.request';
import { Category } from '../models/category.model';
import { Color } from '../models/color.model';
import { ICloudService } from '../services/cloud/cloud.service.interface';
import { CloudinaryService } from '../services/cloud/implements/cloudinary.service.implement';
import { IImportService } from '../services/importer/product_import.service.interface';
import { ProductImportService } from '../services/importer/implements/product_import.service.implement';
import { IVariantService } from '../services/product/variant.service.interface';
import { VariantService } from '../services/product/implements/variant.service.implement';
import { IProductCacheService } from '../services/product/product_cache.service.interface';
import { ProductCacheService } from '../services/product/implements/product_cache.service.implement';

export class ProductController {
  private readonly productService: IProductService;
  private readonly cloudinaryService: ICloudService;
  private readonly importService: IImportService;
  private readonly variantService: IVariantService;
  private readonly productCacheService: IProductCacheService;

  constructor() {
    this.productService = new ProductService();
    this.cloudinaryService = new CloudinaryService();
    this.importService = new ProductImportService();
    this.variantService = new VariantService();
    this.productCacheService = new ProductCacheService();
  }

  async getProductById(req: Request, res: Response) {
    const { id } = req.params;
    const product = await this.productService.getProductById(id);
    res.status(200).json(ApiResponse.success('Thông tin sản phẩm', product));
  }

  async getAllProducts(req: Request, res: Response) {
    const { page = 1, limit = 10 } = req.query;
    const products = await this.productService.getAllProducts(
      Number(page),
      Number(limit),
    );
    res.status(200).json(ApiResponse.success('Danh sách sản phẩm', products));
  }

  async searchProducts(req: Request, res: Response) {
    const {
      search,
      categoryId,
      slug,
      sort = 'desc',
      sortBy = 'createdAt',
      page = 1,
      limit = 10,
    } = req.query;

    const products = await this.productService.searchProducts(
      search as string,
      categoryId as string,
      slug as string,
      sort as string,
      sortBy as string,
      Number(page),
      Number(limit),
    );

    res.status(200).json(ApiResponse.success('Tìm kiếm sản phẩm', products));
  }

  async createProduct(req: Request, res: Response) {
    const uploadedPublicIds: string[] = [];

    try {
      const files = (req.files as Express.Multer.File[]) || [];

      // Parse productData - handle cả JSON string và object
      let productData: any;
      if (typeof req.body.productData === 'string') {
        try {
          productData = JSON.parse(req.body.productData);
        } catch (e) {
          return res.status(400).json(
            ApiResponse.error('Invalid productData format', [
              {
                field: 'productData',
                message: ['Product data format không hợp lệ'],
              },
            ]),
          );
        }
      } else {
        productData = req.body;
      }

      // 1. Handle product image - ưu tiên URL có sẵn
      let productImageUrl = productData.imageUrl || '';
      const productImageFile = files.find(
        (f) => f.fieldname === 'productImage',
      );

      if (productImageFile) {
        const uploadResult = await this.cloudinaryService.uploadImage(
          productImageFile,
          'fashion-website/products',
        );
        productImageUrl = uploadResult.url;
        uploadedPublicIds.push(uploadResult.publicId);
      }

      // Validate product image
      if (!productImageUrl) {
        if (uploadedPublicIds.length > 0) {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
        }
        return res.status(400).json(
          ApiResponse.validationError([
            {
              field: 'imageUrl',
              message: ['Ảnh sản phẩm là bắt buộc'],
            },
          ]),
        );
      }

      // 2. Handle variant images
      const variants: any[] = [];

      if (productData.variants) {
        const variantsArray = Array.isArray(productData.variants)
          ? productData.variants
          : Object.values(productData.variants);

        for (let i = 0; i < variantsArray.length; i++) {
          const variantData = variantsArray[i];

          // Tìm file theo pattern: variants[0][image], variants[1][image], ...
          const variantImageFile = files.find(
            (f) =>
              f.fieldname === `variants[${i}][image]` ||
              f.fieldname === `variants.${i}.image` ||
              f.fieldname === `variants[${i}].image`,
          );

          // Ưu tiên URL có sẵn, nếu không thì upload file
          let variantImageUrl = variantData.imageUrl || '';

          if (variantImageFile) {
            try {
              const uploadResult = await this.cloudinaryService.uploadImage(
                variantImageFile,
                'fashion-website/variants',
              );
              variantImageUrl = uploadResult.url;
              uploadedPublicIds.push(uploadResult.publicId);
            } catch (uploadError) {
              // Nếu upload variant image fail, rollback tất cả
              if (uploadedPublicIds.length > 0) {
                await this.cloudinaryService.deleteMultipleImages(
                  uploadedPublicIds,
                );
              }
              throw new Error(`Lỗi upload ảnh variant ${i}: ${uploadError}`);
            }
          }

          // Validate variant image
          if (!variantImageUrl) {
            if (uploadedPublicIds.length > 0) {
              await this.cloudinaryService.deleteMultipleImages(
                uploadedPublicIds,
              );
            }
            return res.status(400).json(
              ApiResponse.validationError([
                {
                  field: `variants[${i}].imageUrl`,
                  message: ['Ảnh variant là bắt buộc'],
                },
              ]),
            );
          }

          variants.push({
            ...variantData,
            imageUrl: variantImageUrl,
          });
        }
      }

      // 3. Create ProductDto
      const createProductDto = new ProductRequestDto();
      Object.assign(createProductDto, productData);
      createProductDto.imageUrl = productImageUrl;

      if (!productData.category?.id) {
        if (uploadedPublicIds.length > 0) {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
        }
        return res.status(400).json(
          ApiResponse.validationError([
            {
              field: 'category',
              message: ['Danh mục là bắt buộc'],
            },
          ]),
        );
      }

      createProductDto.category = { id: productData.category.id } as Category;

      // 4. Map variants to DTOs
      if (variants.length > 0) {
        createProductDto.variants = variants.map((variant: any) => {
          const variantDto = new VariantRequestDto();
          Object.assign(variantDto, variant);
          variantDto.color = { id: variant.color?.id } as Color;

          // Convert numbers - chỉ convert khi chưa phải number
          variantDto.price =
            typeof variant.price === 'number'
              ? variant.price
              : Number(variant.price);
          variantDto.discountPrice =
            typeof variant.discountPrice === 'number'
              ? variant.discountPrice
              : Number(variant.discountPrice);
          variantDto.discountPercent = variant.discountPercent
            ? typeof variant.discountPercent === 'number'
              ? variant.discountPercent
              : Number(variant.discountPercent)
            : 0;

          // Set defaults cho optional fields
          variantDto.onSales = variant.onSales ?? false;
          variantDto.saleNote = variant.saleNote || '';

          return variantDto;
        });
      }

      // 5. Validate DTO
      const errors = await validate(createProductDto);
      if (errors.length > 0) {
        // Rollback uploaded images
        if (uploadedPublicIds.length > 0) {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
        }

        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));

        return res
          .status(400)
          .json(ApiResponse.validationError(validationErrors));
      }

      // 6. Create product
      const product = await this.productService.createProduct(createProductDto);
      return res.status(200).json(ApiResponse.success('Tạo sản phẩm', product));
    } catch (error: any) {
      // Rollback on error
      if (uploadedPublicIds.length > 0) {
        try {
          await this.cloudinaryService.deleteMultipleImages(uploadedPublicIds);
          console.info(
            `Rolled back ${uploadedPublicIds.length} uploaded images due to error: ${error.message}`,
          );
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded images:', cleanupError);
        }
      }

      return res.status(500).json(
        ApiResponse.error('Tạo sản phẩm', [
          {
            message: error.message || 'Tạo sản phẩm thất bại',
            field: 'createProduct',
          },
        ]),
      );
    }
  }

  async updateProduct(req: Request, res: Response) {
    const updateProductDto = new UpdateProductRequestDto();
    Object.assign(updateProductDto, req.body);

    updateProductDto.category = { id: req.body.category.id } as Category;

    if (req.body.variants && req.body.variants.length > 0) {
      updateProductDto.variants = req.body.variants.map((variant: any) => {
        const variantDto = new UpdateVariantRequestDto();
        Object.assign(variantDto, variant);
        if (variant.color) {
          variantDto.color = { id: variant.color.id } as Color;
        }
        return variantDto;
      });
    }

    const errors = await validate(updateProductDto);
    if (errors.length > 0) {
      const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
        field: error.property,
        message: Object.values(error.constraints || {}),
      }));
      return res
        .status(400)
        .json(ApiResponse.error('Lỗi xác thực', validationErrors));
    }

    const product = await this.productService.updateProduct(updateProductDto);
    res.status(200).json(ApiResponse.success('Cập nhật sản phẩm', product));
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.productService.deleteProduct(id);
      res.status(200).json(ApiResponse.success('Xóa sản phẩm', null));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Xóa sản phẩm', [
          {
            message: 'Xóa sản phẩm thất bại',
            field: 'deleteProduct',
          },
        ]),
      );
    }
  }

  async importProducts(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json(
          ApiResponse.error('Thiếu file', [
            {
              field: 'file',
              message: ['Vui lòng upload file'],
            },
          ]),
        );
      }

      // Determine file type
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      let parseResult;

      switch (fileExtension) {
        case 'json':
          parseResult = await this.importService.parseJSON(file);
          break;
        case 'csv':
          parseResult = await this.importService.parseCSV(file);
          break;
        case 'xlsx':
        case 'xls':
          parseResult = await this.importService.parseExcel(file);
          break;
        default:
          return res.status(400).json(
            ApiResponse.error('Định dạng file không hỗ trợ', [
              {
                field: 'file',
                message: ['Chỉ hỗ trợ file JSON, CSV, Excel (.xlsx, .xls)'],
              },
            ]),
          );
      }

      // Validate parsed data
      if (parseResult.errors.length > 0 && parseResult.successCount === 0) {
        return res.status(400).json(
          ApiResponse.error(
            'Tất cả dòng đều có lỗi',
            parseResult.errors.map((err: any) => ({
              field: err.field || '',
              message: [err.message],
              row: err.row,
            })),
          ),
        );
      }

      // Import products
      const importedProducts = [];
      const importErrors = [];

      for (const item of parseResult.data) {
        try {
          // Validate product DTO
          const productErrors = await validate(item.product);
          if (productErrors.length > 0) {
            importErrors.push({
              product: item.product.name,
              errors: productErrors.map((e) => ({
                field: e.property,
                message: Object.values(e.constraints || {}),
              })),
            });
            continue;
          }

          // Validate variants
          if (item.variants && item.variants.length > 0) {
            for (const variant of item.variants) {
              const variantErrors = await validate(variant);
              if (variantErrors.length > 0) {
                importErrors.push({
                  product: item.product.name,
                  variant: variant.sku,
                  errors: variantErrors.map((e) => ({
                    field: e.property,
                    message: Object.values(e.constraints || {}),
                  })),
                });
              }
            }
          }

          // Create product
          const product = await this.productService.createProduct(item.product);
          importedProducts.push(product);
        } catch (error: any) {
          importErrors.push({
            product: item.product.name,
            message: error.message || 'Lỗi không xác định',
          });
        }
      }

      // Return result
      res.status(200).json(
        ApiResponse.success('Import sản phẩm', {
          summary: {
            totalRows: parseResult.totalRows,
            successCount: importedProducts.length,
            errorCount: parseResult.errorCount + importErrors.length,
            parseErrors: parseResult.errors,
            importErrors: importErrors,
          },
          products: importedProducts,
        }),
      );
    } catch (error: any) {
      res.status(500).json(
        ApiResponse.error('Import sản phẩm thất bại', [
          {
            field: 'import',
            message: error.message || 'Lỗi không xác định',
          },
        ]),
      );
    }
  }

  /**
   * Import products only (from separate file)
   */
  async importProductsOnly(req: Request, res: Response) {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const file = req.file || files[0]; // Lấy file đầu tiên hoặc từ req.file

      if (!file) {
        return res.status(400).json(
          ApiResponse.error('Thiếu file', [
            {
              field: 'file',
              message: [
                `Không tìm thấy file. req.files: ${JSON.stringify(
                  files.map((f) => ({
                    fieldname: f.fieldname,
                    originalname: f.originalname,
                  })),
                )}, req.file: ${req.file?.originalname || 'undefined'}`,
              ],
            },
          ]),
        );
      }

      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      let parseResult;

      switch (fileExtension) {
        case 'json':
          parseResult = await this.importService.parseProductsOnlyJSON(file);
          break;
        case 'csv':
          parseResult = await this.importService.parseProductsOnlyCSV(file);
          break;
        case 'xlsx':
        case 'xls':
          parseResult = await this.importService.parseProductsOnlyExcel(file);
          break;
        default:
          return res.status(400).json(
            ApiResponse.error('Định dạng file không hỗ trợ', [
              {
                field: 'file',
                message: ['Chỉ hỗ trợ file JSON, CSV, Excel'],
              },
            ]),
          );
      }

      if (parseResult.errors.length > 0 && parseResult.successCount === 0) {
        return res.status(400).json(
          ApiResponse.error(
            'Tất cả dòng đều có lỗi',
            parseResult.errors.map((err: any) => ({
              field: err.field || '',
              message: [err.message],
              row: err.row,
            })),
          ),
        );
      }

      const importedProducts = [];
      const importErrors = [];

      for (const productDto of parseResult.data) {
        try {
          const errors = await validate(productDto);
          if (errors.length > 0) {
            importErrors.push({
              product: productDto.name,
              errors: errors.map((e) => ({
                field: e.property,
                message: Object.values(e.constraints || {}),
              })),
            });
            continue;
          }

          const product = await this.productService.createProductWithId(
            productDto,
          );
          importedProducts.push(product);
        } catch (error: any) {
          importErrors.push({
            product: productDto.name,
            message: error.message || 'Lỗi không xác định',
          });
        }
      }

      res.status(200).json(
        ApiResponse.success('Import sản phẩm', {
          summary: {
            totalRows: parseResult.totalRows,
            successCount: importedProducts.length,
            errorCount: parseResult.errorCount + importErrors.length,
            parseErrors: parseResult.errors,
            importErrors: importErrors,
          },
          products: importedProducts,
        }),
      );
    } catch (error: any) {
      res
        .status(500)
        .json(
          ApiResponse.error('Import sản phẩm thất bại', [
            { field: 'import', message: error.message || 'Lỗi không xác định' },
          ]),
        );
    }
  }

  /**
   * Import variants only (from separate file)
   * Requires products to exist first
   */
  async importVariantsOnly(req: Request, res: Response) {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const file = req.file || files[0]; // Lấy file đầu tiên hoặc từ req.file

      if (!file) {
        return res
          .status(400)
          .json(
            ApiResponse.error('Thiếu file', [
              { field: 'file', message: ['Vui lòng upload file'] },
            ]),
          );
      }

      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      let parseResult;

      switch (fileExtension) {
        case 'json':
          parseResult = await this.importService.parseVariantsOnlyJSON(file);
          break;
        case 'csv':
          parseResult = await this.importService.parseVariantsOnlyCSV(file);
          break;
        case 'xlsx':
        case 'xls':
          parseResult = await this.importService.parseVariantsOnlyExcel(file);
          break;
        default:
          return res.status(400).json(
            ApiResponse.error('Định dạng file không hỗ trợ', [
              {
                field: 'file',
                message: ['Chỉ hỗ trợ file JSON, CSV, Excel'],
              },
            ]),
          );
      }

      if (parseResult.errors.length > 0 && parseResult.successCount === 0) {
        return res.status(400).json(
          ApiResponse.error(
            'Tất cả dòng đều có lỗi',
            parseResult.errors.map((err: any) => ({
              field: err.field || '',
              message: [err.message],
              row: err.row,
            })),
          ),
        );
      }

      const importedVariants = [];
      const importErrors = [];

      for (const item of parseResult.data) {
        try {
          // Find product by ID, slug, or name
          let product = null;
          if (item.productId) {
            try {
              product = await this.productService.getProductById(
                item.productId,
              );
            } catch (e) {
              console.error('Failed to get product by ID:', e);
            }
          }

          if (!product) {
            importErrors.push({
              productId: item.productId,
              productSlug: item.productSlug,
              message: 'Không tìm thấy sản phẩm',
            });
            continue;
          }

          // Validate and create variants
          for (const variantDto of item.variants) {
            try {
              const errors = await validate(variantDto);
              if (errors.length > 0) {
                importErrors.push({
                  product: product.name,
                  variant: variantDto.sku,
                  errors: errors.map((e) => ({
                    field: e.property,
                    message: Object.values(e.constraints || {}),
                  })),
                });
                continue;
              }

              // Set product reference and create variant
              variantDto.product = { id: product.id } as any;
              const createdVariant = await this.variantService.createVariant(
                variantDto,
              );
              importedVariants.push({
                product: product.name,
                variant: createdVariant,
              });
            } catch (error: any) {
              importErrors.push({
                product: product.name,
                variant: variantDto.sku,
                message: error.message || 'Lỗi không xác định',
              });
            }
          }
        } catch (error: any) {
          importErrors.push({
            productId: item.productId,
            productSlug: item.productSlug,
            message: error.message || 'Lỗi không xác định',
          });
        }
      }

      await this.productCacheService.reindexAllProducts();

      res.status(200).json(
        ApiResponse.success('Import variants', {
          summary: {
            totalRows: parseResult.totalRows,
            successCount: importedVariants.length,
            errorCount: parseResult.errorCount + importErrors.length,
            parseErrors: parseResult.errors,
            importErrors: importErrors,
          },
          variants: importedVariants,
        }),
      );
    } catch (error: any) {
      res
        .status(500)
        .json(
          ApiResponse.error('Import variants thất bại', [
            { field: 'import', message: error.message || 'Lỗi không xác định' },
          ]),
        );
    }
  }
}
