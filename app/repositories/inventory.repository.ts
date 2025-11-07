import { Repository } from 'typeorm';
import { Inventory } from '../models/inventory.model';
import { AppDataSource } from '../config/data_source';
import {
  CreateInventoryRequestDto,
  UpdateInventoryRequestDto,
} from '../dtos/request/inventory/inventory.request';

export default class InventoryRepository {
  private readonly inventoryRepository: Repository<Inventory>;

  constructor() {
    this.inventoryRepository = AppDataSource.getRepository(Inventory);
  }

  async getInventoryById(id: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { id },
      relations: ['warehouse', 'variant'],
    });
  }

  async getInventoryByVariantId(variantId: string): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { variant: { id: variantId } },
      relations: ['warehouse', 'variant'],
    });
  }

  async getInventoryByVariantIdAndWarehouseId(
    variantId: string,
    warehouseId: string,
  ): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({
      where: { variant: { id: variantId }, warehouse: { id: warehouseId } },
      relations: ['warehouse', 'variant'],
    });
  }

  async updateInventory(
    inventory: UpdateInventoryRequestDto,
  ): Promise<Inventory> {
    return this.inventoryRepository.save(inventory);
  }

  async createInventory(
    inventory: CreateInventoryRequestDto,
  ): Promise<Inventory> {
    return this.inventoryRepository.create(inventory);
  }

  async getInventoryByWarehouseId(warehouseId: string): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      where: { warehouse: { id: warehouseId } },
      relations: ['warehouse', 'variant'],
    });
  }

  async getAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      relations: ['warehouse', 'variant'],
    });
  }
}
