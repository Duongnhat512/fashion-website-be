import { Request, Response } from 'express';
import { WarehouseService } from '../services/warehouse/implements/warehouse.service.implement';
import { IWarehouseService } from '../services/warehouse/warehouse.service.interface';
import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '../dtos/request/product/warehouse.request';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { validate } from 'class-validator';

export class WarehouseController {
  private readonly warehouseService: IWarehouseService;
  constructor() {
    this.warehouseService = new WarehouseService();
  }

  async create(req: Request, res: Response) {
    try {
      const createWarehouseRequest = new CreateWarehouseRequest();
      Object.assign(createWarehouseRequest, req.body);

      const errors = await validate(createWarehouseRequest);
      if (errors.length > 0) {
        return res.status(400).json(
          ApiResponse.error(
            'Dữ liệu không hợp lệ',
            errors.map((error) => ({
              field: error.property,
              message: Object.values(error.constraints || {}).join(', '),
            })),
          ),
        );
      }

      const warehouse = await this.warehouseService.create(
        createWarehouseRequest,
      );
      res
        .status(201)
        .json(ApiResponse.success('Tạo kho thành công', warehouse));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Tạo kho thất bại'));
    }
  }

  async update(req: Request, res: Response) {
    try {
      const updateWarehouseRequest = new UpdateWarehouseRequest();
      Object.assign(updateWarehouseRequest, req.body);

      const errors = await validate(updateWarehouseRequest);
      if (errors.length > 0) {
        return res.status(400).json(
          ApiResponse.error(
            'Dữ liệu không hợp lệ',
            errors.map((error) => ({
              field: error.property,
              message: Object.values(error.constraints || {}).join(', '),
            })),
          ),
        );
      }

      const warehouse = await this.warehouseService.update(
        updateWarehouseRequest,
      );
      res
        .status(200)
        .json(
          ApiResponse.success('Cập nhật thông tin kho thành công', warehouse),
        );
    } catch (error) {
      res.status(500).json(ApiResponse.error('Cập nhật kho thất bại'));
    }
  }
}
