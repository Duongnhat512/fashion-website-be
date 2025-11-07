import { DataSource } from 'typeorm';
import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '../../../dtos/request/product/warehouse.request';
import { Inventory } from '../../../models/inventory.model';
import { Variant } from '../../../models/variant.model';
import { Warehouse } from '../../../models/warehouse.model';
import { WarehouseRepository } from '../../../repositories/warehouse.repository';
import { IWarehouseService } from '../warehouse.service.interface';
import { AppDataSource } from '../../../config/data_source';

export class WarehouseService implements IWarehouseService {
  private readonly warehouseRepository: WarehouseRepository;
  private readonly dataSource: DataSource;
  constructor() {
    this.warehouseRepository = new WarehouseRepository();
    this.dataSource = AppDataSource;
  }
  getAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.findAll();  
  }
  getById(id: string): Promise<Warehouse> {
    return this.warehouseRepository.findById(id);
  }

  async create(warehouseData: CreateWarehouseRequest): Promise<Warehouse> {
    return await this.dataSource.transaction(async (manager) => {
      const warehouseRepo = manager.getRepository(Warehouse);
      const warehouse = warehouseRepo.create(warehouseData);
      const savedWarehouse = await warehouseRepo.save(warehouse);

      const variantRepo = manager.getRepository(Variant);
      const allVariants = await variantRepo.find();

      const inventoryRepo = manager.getRepository(Inventory);
      const inventoryPromises = allVariants.map((variant) => {
        const inventory = inventoryRepo.create({
          warehouse: savedWarehouse,
          variant: variant,
          onHand: 0,
        });
        return inventoryRepo.save(inventory);
      });

      await Promise.all(inventoryPromises);

      return savedWarehouse;
    });
  }

  async update(warehouse: UpdateWarehouseRequest): Promise<Warehouse> {
    return this.warehouseRepository.update(warehouse);
  }
}
