import { Request, Response } from 'express';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { InventoryService } from '../services/inventory/implements/inventory.service.implement';
import IInventoryService from '../services/inventory/inventory.service.interface';

export class InventoryController {
  private readonly inventoryService: IInventoryService;
  constructor() {
    this.inventoryService = new InventoryService();
  }
  async getAll(req: Request, res: Response) {
    const inventories = await this.inventoryService.getAll();
    res
      .status(200)
      .json(ApiResponse.success('Lấy danh sách kho thành công', inventories));
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const inventory = await this.inventoryService.getById(id);
    res
      .status(200)
      .json(ApiResponse.success('Lấy thông tin kho thành công', inventory));
  }

  async getByWarehouseId(req: Request, res: Response) {
    const { warehouseId } = req.params;
    const inventories = await this.inventoryService.getByWarehouseId(
      warehouseId,
    );
    res
      .status(200)
      .json(ApiResponse.success('Lấy danh sách kho thành công', inventories));
  }

  async getByVariantId(req: Request, res: Response) {
    const { variantId } = req.params;
    const inventories = await this.inventoryService.getByVariantId(variantId);
    res
      .status(200)
      .json(ApiResponse.success('Lấy danh sách kho thành công', inventories));
  }

  async getByWarehouseIdAndVariantId(req: Request, res: Response) {
    const { warehouseId, variantId } = req.params;
    const inventory = await this.inventoryService.getByWarehouseIdAndVariantId(
      warehouseId,
      variantId,
    );
    res
      .status(200)
      .json(ApiResponse.success('Lấy thông tin kho thành công', inventory));
  }
}
