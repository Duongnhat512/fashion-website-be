import { Request, Response } from 'express';
import { IProductService } from '../services/product.service.interface';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ProductService } from '../services/implements/product.service.implement';
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

export class ProductController {
  private readonly productService: IProductService;
  constructor() {
    this.productService = new ProductService();
  }

  async getProductById(req: Request, res: Response) {
    const { id } = req.params;
    const product = await this.productService.getProductById(id);
    res.status(200).json(ApiResponse.success('Get product by id', product));
  }

  async getAllProducts(req: Request, res: Response) {
    const { page = 1, limit = 10 } = req.query;
    const products = await this.productService.getAllProducts(
      Number(page),
      Number(limit),
    );
    res.status(200).json(ApiResponse.success('Get all products', products));
  }

  async searchProducts(req: Request, res: Response) {
    const {
      search,
      categoryId,
      sort = 'desc',
      sortBy = 'createdAt',
      page = 1,
      limit = 10,
    } = req.query;

    const products = await this.productService.searchProducts(
      search as string,
      categoryId as string,
      sort as string,
      sortBy as string,
      Number(page),
      Number(limit),
    );

    res.status(200).json(ApiResponse.success('Search products', products));
  }

  async createProduct(req: Request, res: Response) {
    try {
      const createProductDto = new ProductRequestDto();
      Object.assign(createProductDto, req.body);

      createProductDto.category = { id: req.body.category.id } as Category;

      if (req.body.variants && req.body.variants.length > 0) {
        createProductDto.variants = req.body.variants.map((variant: any) => {
          const variantDto = new VariantRequestDto();
          Object.assign(variantDto, variant);
          variantDto.color = { id: variant.color.id } as Color;
          return variantDto;
        });
      }

      const errors = await validate(createProductDto);

      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));

        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const product = await this.productService.createProduct(createProductDto);
      res.status(200).json(ApiResponse.success('Create product', product));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Create product', [
          {
            message: 'Create product failed',
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
        .json(ApiResponse.error('Validation errors', validationErrors));
    }

    const product = await this.productService.updateProduct(updateProductDto);
    res.status(200).json(ApiResponse.success('Update product', product));
  }

  async deleteProduct(req: Request, res: Response) {
    const { id } = req.params;

    await this.productService.deleteProduct(id);
    res.status(200).json(ApiResponse.success('Delete product', null));
  }
}
