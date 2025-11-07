import { Inventory } from '../../../models/inventory.model';
import InventoryRepository from '../../../repositories/inventory.repository';
import IInventoryService from '../inventory.service.interface';

export class InventoryService implements IInventoryService {
  private readonly inventoryRepository: InventoryRepository;
  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }
  async getByWarehouseIdAndVariantId(
    warehouseId: string,
    variantId: string,
  ): Promise<Inventory> {
    const inventory =
      await this.inventoryRepository.getInventoryByVariantIdAndWarehouseId(
        variantId,
        warehouseId,
      );
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }

  async getAll(): Promise<Inventory[]> {
    return await this.inventoryRepository.getAll();
  }
  async getById(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.getInventoryById(id);
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }
  async getByWarehouseId(warehouseId: string): Promise<Inventory[]> {
    const inventory = await this.inventoryRepository.getInventoryByWarehouseId(
      warehouseId,
    );
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }
  async getByVariantId(variantId: string): Promise<Inventory[]> {
    const inventory = await this.inventoryRepository.getInventoryByVariantId(
      variantId,
    );
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }
}
