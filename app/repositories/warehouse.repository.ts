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

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find();
  }

  async findById(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }
    return warehouse;
  }
}
