import { Request, Response } from 'express';
import { IProductService } from '../services/product.service.interface';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ProductService } from '../services/implements/product.service.implement';

export class ProductController {
  private readonly productService: IProductService;
  constructor() {
    this.productService = new ProductService();
  }

  async getAllProducts(req: Request, res: Response) {
    const { page, limit } = req.query;
    const products = await this.productService.getAllProducts(
      Number(page),
      Number(limit),
    );
    res.status(200).json(ApiResponse.success('Get all products', products));
  }
}
