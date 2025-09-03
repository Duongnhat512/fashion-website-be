import { Request, Response } from 'express';
import { IProductService } from '../services/product.service.interface';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ProductService } from '../services/implements/product.service.implement';
import { ProductRequestDto } from '../dtos/request/product/product.request';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';

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
    const { search, page = 1, limit = 10 } = req.query;
    const products = await this.productService.searchProducts(
      search as string,
      Number(page),
      Number(limit),
    );
    res.status(200).json(ApiResponse.success('Search products', products));
  }

  async filterProducts(req: Request, res: Response) {
    const {
      categoryId,
      sort = 'desc',
      sortBy = 'createdAt',
      page = 1,
      limit = 10,
    } = req.query;
    const products = await this.productService.filterProducts(
      categoryId as string,
      sort as string,
      sortBy as string,
      Number(page),
      Number(limit),
    );
    res.status(200).json(ApiResponse.success('Filter products', products));
  }

  async createProduct(req: Request, res: Response) {
    try {
      const createProductDto = new ProductRequestDto();
      Object.assign(createProductDto, req.body);

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
}
