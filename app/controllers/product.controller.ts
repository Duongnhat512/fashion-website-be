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

export class ProductController {
  private readonly productService: IProductService;
  private readonly cloudinaryService: ICloudService;

  constructor() {
    this.productService = new ProductService();
    this.cloudinaryService = new CloudinaryService();
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
}
