import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import {
  FilterStockEntryRequestDto,
  ImportStockEntryRequestDto,
} from '../dtos/request/stock_entry/stock_entry.request';
import { IStockEntryService } from '../services/stock_entry.service.interface';
import { StockEntryServiceImplement } from '../services/implements/stock_entry.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { plainToInstance } from 'class-transformer';

export class StockEntryController {
  private readonly stockEntryService: IStockEntryService;
  constructor() {
    this.stockEntryService = new StockEntryServiceImplement();
  }

  createStockEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const stockEntry = plainToInstance(ImportStockEntryRequestDto, req.body);

      const errors = await validate(stockEntry);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const result = await this.stockEntryService.create(stockEntry);
      res
        .status(201)
        .json(ApiResponse.success('Phiếu nhập kho đã được tạo', result));
      return;
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  };

  submitStockEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.stockEntryService.summit(id);
      res
        .status(200)
        .json(
          ApiResponse.success(
            'Phiếu nhập kho đã được gửi và cập nhật tồn kho',
            result,
          ),
        );
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  };

  cancelStockEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.stockEntryService.cancel(id);
      res
        .status(200)
        .json(
          ApiResponse.success(
            'Phiếu nhập kho đã được hủy và trừ lại tồn kho',
            result,
          ),
        );
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  };

  filterStockEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = plainToInstance(FilterStockEntryRequestDto, req.query);
      const result = await this.stockEntryService.filter(filter);
      res
        .status(200)
        .json(ApiResponse.success('Phiếu nhập kho đã được lọc', result));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Internal server error',
          ),
        );
    }
  };
}
