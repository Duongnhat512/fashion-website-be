import { Repository } from 'typeorm';
import { Inventory } from '../models/inventory.model';
import { AppDataSource } from '../config/data_source';

export class InventoryRepository {
  private readonly inventoryRepository: Repository<Inventory>;

  constructor() {
    this.inventoryRepository = AppDataSource.getRepository(Inventory);
  }

  async getInventoryById(id: string): Promise<Inventory> {
    return this.inventoryRepository.findOne({
      where: { id },
      relations: ['warehouse', 'variant'],
    }) as Promise<Inventory>;
  }

  async getInventoryByVariantId(variantId: string): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { variant: { id: variantId } },
      relations: ['warehouse', 'variant'],
    });
  }

  async updateInventory(inventory: Inventory): Promise<Inventory> {
    return this.inventoryRepository.save(inventory);
  }
}
