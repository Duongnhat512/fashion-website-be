import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { Warehouse } from '../models/warehouse.model';
import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '../dtos/request/product/warehouse.request';

export class WarehouseRepository {
  private readonly warehouseRepository: Repository<Warehouse>;

  constructor() {
    this.warehouseRepository = AppDataSource.getRepository(Warehouse);
  }

  async create(warehouse: CreateWarehouseRequest): Promise<Warehouse> {
    return this.warehouseRepository.save(warehouse);
  }

  async update(warehouse: UpdateWarehouseRequest): Promise<Warehouse> {
    return this.warehouseRepository.save(warehouse);
  }
}
