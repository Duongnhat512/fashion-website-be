import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import {
  CreateVoucherRequestDto,
  UpdateVoucherRequestDto,
  VoucherQueryDto,
} from '../dtos/request/voucher/voucher.request';
import { VoucherService } from '../services/voucher/implements/voucher.service.implement';

export class VoucherController {
  private readonly voucherService: VoucherService;

  constructor() {
    this.voucherService = new VoucherService();
  }

  createVoucher = async (req: Request, res: Response) => {
    try {
      const dto = new CreateVoucherRequestDto();
      Object.assign(dto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        return res
          .status(400)
          .json(ApiResponse.validationError(validationErrors));
      }

      const result = await this.voucherService.create(
        dto,
        req.user?.userId, // eslint-disable-line @typescript-eslint/no-unsafe-member-access
      );
      return res
        .status(201)
        .json(ApiResponse.success('Tạo voucher thành công', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Không thể tạo voucher', [
          {
            field: 'voucher',
            message: (error as Error).message,
          },
        ]),
      );
    }
  };

  updateVoucher = async (req: Request, res: Response) => {
    try {
      const dto = new UpdateVoucherRequestDto();
      Object.assign(dto, req.body);
      const errors = await validate(dto, { skipMissingProperties: true });
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        return res
          .status(400)
          .json(ApiResponse.validationError(validationErrors));
      }

      const result = await this.voucherService.update(req.params.id, dto);
      return res
        .status(200)
        .json(ApiResponse.success('Cập nhật voucher thành công', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Không thể cập nhật voucher', [
          {
            field: 'voucher',
            message: (error as Error).message,
          },
        ]),
      );
    }
  };

  deleteVoucher = async (req: Request, res: Response) => {
    try {
      const id = await this.voucherService.delete(req.params.id);
      return res
        .status(200)
        .json(ApiResponse.success('Xóa voucher thành công', id));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Không thể xóa voucher', [
          {
            field: 'voucher',
            message: (error as Error).message,
          },
        ]),
      );
    }
  };

  getVoucherById = async (req: Request, res: Response) => {
    try {
      const result = await this.voucherService.getById(req.params.id);
      return res
        .status(200)
        .json(ApiResponse.success('Chi tiết voucher', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Không thể lấy voucher', [
          {
            field: 'voucher',
            message: (error as Error).message,
          },
        ]),
      );
    }
  };

  getVouchers = async (req: Request, res: Response) => {
    try {
      const queryDto = new VoucherQueryDto();
      Object.assign(queryDto, {
        search: req.query.search ? String(req.query.search) : undefined,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === 'true'
            : undefined,
        includeExpired:
          req.query.includeExpired !== undefined
            ? req.query.includeExpired === 'true'
            : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      const errors = await validate(queryDto, { skipMissingProperties: true });
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        return res
          .status(400)
          .json(ApiResponse.validationError(validationErrors));
      }

      const result = await this.voucherService.list(queryDto);
      return res
        .status(200)
        .json(ApiResponse.success('Danh sách voucher', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Không thể lấy danh sách voucher', [
          {
            field: 'voucher',
            message: (error as Error).message,
          },
        ]),
      );
    }
  };

  toggleVoucher = async (req: Request, res: Response) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json(
          ApiResponse.validationError([
            {
              field: 'isActive',
              message: ['Trạng thái phải là boolean'],
            },
          ]),
        );
      }
      const result = await this.voucherService.toggle(req.params.id, isActive);
      return res
        .status(200)
        .json(ApiResponse.success('Cập nhật trạng thái voucher thành công', result));
    } catch (error) {
      return res.status(500).json(
        ApiResponse.error('Không thể cập nhật trạng thái voucher', [
          {
            field: 'voucher',
            message: (error as Error).message,
          },
        ]),
      );
    }
  };
}

