import { Request, Response } from 'express';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import {
  CreatePromotionRequestDto,
  UpdatePromotionRequestDto,
} from '../dtos/request/promotion/promotion.request';
import { PromotionService } from '../services/promotion/implements/promotion.service.implement';

export class PromotionController {
  private readonly service = new PromotionService();

  create = async (req: Request, res: Response) => {
    try {
      const dto = new CreatePromotionRequestDto();
      Object.assign(dto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((e) => ({
          field: e.property,
          message: Object.values(e.constraints || {}),
        }));
        return res
          .status(400)
          .json(ApiResponse.validationError(validationErrors));
      }
      const result = await this.service.create(dto);
      res
        .status(201)
        .json(ApiResponse.success('Tạo khuyến mãi thành công', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi tạo khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const dto = new UpdatePromotionRequestDto();
      Object.assign(dto, { ...req.body, id: req.params.id });
      const result = await this.service.update(dto);
      res
        .status(200)
        .json(ApiResponse.success('Cập nhật khuyến mãi thành công', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi cập nhật khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = await this.service.delete(req.params.id);
      res
        .status(200)
        .json(ApiResponse.success('Xóa khuyến mãi thành công', id));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi xóa khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const result = await this.service.getById(req.params.id);
      res.status(200).json(ApiResponse.success('Chi tiết khuyến mãi', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi lấy chi tiết khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };

  getPromotions = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, productId, categoryId, active } = req.query;
      const result = await this.service.getPromotions({
        page: Number(page),
        limit: Number(limit),
        productId: productId as string | undefined,
        categoryId: categoryId as string | undefined,
        active: active !== undefined ? active === 'true' : undefined,
      });
      res.status(200).json(ApiResponse.success('Danh sách khuyến mãi', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi lấy danh sách khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };

  submit = async (req: Request, res: Response) => {
    try {
      await this.service.submit(req.params.id);
      res.status(200).json(ApiResponse.success('Đã submit khuyến mãi'));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi submit khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };

  activate = async (req: Request, res: Response) => {
    try {
      await this.service.activate(req.params.id);
      res.status(200).json(ApiResponse.success('Đã bật khuyến mãi'));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi bật khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };

  deactivate = async (req: Request, res: Response) => {
    try {
      await this.service.deactivate(req.params.id);
      res.status(200).json(ApiResponse.success('Đã tắt khuyến mãi'));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Lỗi khi tắt khuyến mãi', [
          {
            field: 'error',
            message:
              error instanceof Error ? error.message : 'Lỗi không xác định',
          },
        ]),
      );
    }
  };
}
