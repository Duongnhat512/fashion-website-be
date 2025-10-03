import { IStockEntryService } from '../stock_entry.service.interface';
import StockEntryRepository from '../../repositories/stock_entry.repository';
import {
  FilterStockEntryRequestDto,
  ImportStockEntryRequestDto,
  UpdateStockEntryRequestDto,
} from '../../dtos/request/stock_entry/stock_entry.request';
import { StockEntryResponse } from '../../dtos/response/stock_entry/stock_entry.response';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/data_source';
import { StockEntry } from '../../models/stock_entry.model';
import { StockEntryStatus } from '../../models/enum/stock_entry_status.enum';
import { Inventory } from '../../models/inventory.model';
import InventoryRepository from '../../repositories/inventory.repository';
import { StockEntryItem } from '../../models/stock_entry_item.model';

export class StockEntryServiceImplement implements IStockEntryService {
  private readonly stockEntryRepository: StockEntryRepository;
  private readonly dataSource: DataSource;
  private readonly inventoryRepository: InventoryRepository;

  constructor() {
    this.stockEntryRepository = new StockEntryRepository();
    this.dataSource = AppDataSource;
    this.inventoryRepository = new InventoryRepository();
  }

  async filter(
    filter: FilterStockEntryRequestDto,
  ): Promise<StockEntryResponse[]> {
    const stockEntries = await this.stockEntryRepository.filter(filter);
    return stockEntries.map(this.mapToResponse);
  }

  async summit(id: string): Promise<StockEntryResponse> {
    return this.dataSource.transaction(async (manager) => {
      const stockEntry = await this.stockEntryRepository.findById(id);
      if (!stockEntry) {
        throw new Error('Không tìm thấy khoản nhập kho');
      }
      if (stockEntry.status !== StockEntryStatus.DRAFT) {
        throw new Error('Khoản nhập kho không phải là bản nháp');
      }

      const updatedStockEntry = await this.stockEntryRepository.updateStatus(
        id,
        StockEntryStatus.SUBMITTED,
      );

      if (stockEntry.stockEntryItems && stockEntry.stockEntryItems.length > 0) {
        await this.updateInventoryQuantities(
          stockEntry.stockEntryItems.map((item) => ({
            inventory: item.inventory,
            quantity: Math.abs(item.quantity),
            unitCost: item.unitCost,
            note: item.note,
          })),
        );
      }

      return this.mapToResponse(updatedStockEntry);
    });
  }

  async cancel(id: string): Promise<StockEntryResponse> {
    return this.dataSource.transaction(async (manager) => {
      const stockEntry = await this.stockEntryRepository.findById(id);
      if (!stockEntry) {
        throw new Error('Không tìm thấy khoản nhập kho');
      }
      if (stockEntry.status !== StockEntryStatus.SUBMITTED) {
        throw new Error('Khoản nhập kho không phải là đã gửi');
      }

      if (stockEntry.stockEntryItems && stockEntry.stockEntryItems.length > 0) {
        await this.updateInventoryQuantities(
          stockEntry.stockEntryItems.map((item) => ({
            inventory: item.inventory,
            quantity: -Math.abs(item.quantity),
            unitCost: item.unitCost,
            note: item.note,
          })),
        );
      }

      const updatedStockEntry = await this.stockEntryRepository.updateStatus(
        id,
        StockEntryStatus.CANCELLED,
      );
      return this.mapToResponse(updatedStockEntry);
    });
  }

  async create(
    importData: ImportStockEntryRequestDto,
  ): Promise<StockEntryResponse> {
    return await this.dataSource.transaction(async (manager) => {
      const totalCost = importData.stockEntryItems.reduce(
        (total, item) => total + item.quantity * item.unitCost,
        0,
      );
      importData.totalCost = totalCost;
      const stockEntry = await this.stockEntryRepository.create(importData);

      return this.mapToResponse(stockEntry);
    });
  }

  async findAll(): Promise<StockEntryResponse[]> {
    const stockEntries = await this.stockEntryRepository.findAll();
    return stockEntries.map(this.mapToResponse);
  }

  async findById(id: string): Promise<StockEntryResponse> {
    const stockEntry = await this.stockEntryRepository.findById(id);
    if (!stockEntry) {
      throw new Error('Stock entry not found');
    }
    return this.mapToResponse(stockEntry);
  }

  async update(
    id: string,
    updatedStockEntry: Partial<UpdateStockEntryRequestDto>,
  ): Promise<StockEntryResponse> {
    return this.dataSource.transaction(async (manager) => {
      const existingStockEntry = await this.stockEntryRepository.findById(id);
      if (!existingStockEntry) {
        throw new Error('Không tìm thấy phiếu nhập kho');
      }

      if (existingStockEntry.status !== StockEntryStatus.DRAFT) {
        throw new Error(
          'Chỉ có thể cập nhật phiếu nhập kho ở trạng thái DRAFT',
        );
      }

      const { stockEntryItems, ...stockEntryData } = updatedStockEntry;

      if (Object.keys(stockEntryData).length > 0) {
        await manager.update(StockEntry, id, stockEntryData);
      }

      if (stockEntryItems) {
        const totalCost = stockEntryItems.reduce(
          (total, item) => total + item.quantity * item.unitCost,
          0,
        );

        await manager.update(StockEntry, id, { totalCost });

        await manager.delete(StockEntryItem, { stockEntry: { id } });

        const newItems = stockEntryItems.map((item) => {
          const stockEntryItem = new StockEntryItem();
          stockEntryItem.stockEntry = { id } as StockEntry;
          stockEntryItem.inventory = { id: item.inventory.id } as any;
          stockEntryItem.quantity = item.quantity;
          stockEntryItem.unitCost = item.unitCost;
          stockEntryItem.note = item.note;
          return stockEntryItem;
        });

        await manager.save(StockEntryItem, newItems);
      }

      const updated = await this.stockEntryRepository.findById(id);
      return this.mapToResponse(updated!);
    });
  }

  private mapToResponse(stockEntry: StockEntry): StockEntryResponse {
    return {
      id: stockEntry.id,
      type: stockEntry.type,
      supplierName: stockEntry.supplierName || '',
      status: stockEntry.status,
      note: stockEntry.note || '',
      totalCost: stockEntry.totalCost,
      createdAt: stockEntry.createdAt,
      updatedAt: stockEntry.updatedAt,
      stockEntryItems: stockEntry.stockEntryItems,
    };
  }

  private async updateInventoryQuantities(
    stockEntryItems: Array<{
      inventory: Inventory;
      quantity: number;
      unitCost: number;
      note?: string;
    }>,
  ): Promise<void> {
    for (const item of stockEntryItems) {
      const inventory = await this.inventoryRepository.getInventoryById(
        item.inventory.id,
      );

      if (!inventory) {
        throw new Error(
          `Không tìm thấy inventory với id: ${item.inventory.id}`,
        );
      }

      inventory.onHand += item.quantity;

      await this.inventoryRepository.updateInventory(inventory);

      console.log(
        `Đã cập nhật inventory ${inventory.id}: +${item.quantity} units. ` +
          `Tổng tồn kho: ${inventory.onHand}`,
      );
    }
  }
}
