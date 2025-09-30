import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '../../dtos/request/product/warehouse.request';
import { Warehouse } from '../../models/warehouse.model';
import { WarehouseRepository } from '../../repositories/warehouse.repository';
import { IWarehouseService } from '../warehouse.service.interface';

export class WarehouseService implements IWarehouseService {
  constructor(private readonly warehouseRepository: WarehouseRepository) {}

  async create(warehouse: CreateWarehouseRequest): Promise<Warehouse> {
    return this.warehouseRepository.create(warehouse);
  }

  async update(warehouse: UpdateWarehouseRequest): Promise<Warehouse> {
    return this.warehouseRepository.update(warehouse);
  }
}
