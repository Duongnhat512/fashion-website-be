import { Repository } from 'typeorm';
import { StockEntry } from '../models/stock_entry.model';
import { AppDataSource } from '../config/data_source';
import {
  FilterStockEntryRequestDto,
  ImportStockEntryRequestDto,
} from '../dtos/request/stock_entry/stock_entry.request';
import { StockEntryStatus } from '../models/enum/stock_entry_status.enum';

export default class StockEntryRepository {
  private readonly stockEntryRepository: Repository<StockEntry>;

  constructor() {
    this.stockEntryRepository = AppDataSource.getRepository(StockEntry);
  }

  async create(stockEntry: ImportStockEntryRequestDto): Promise<StockEntry> {
    return this.stockEntryRepository.save(stockEntry);
  }

  async save(stockEntry: StockEntry): Promise<StockEntry> {
    return this.stockEntryRepository.save(stockEntry);
  }

  async findAll(): Promise<StockEntry[]> {
    return this.stockEntryRepository.find({
      relations: ['stockEntryItems', 'stockEntryItems.inventory'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<StockEntry | null> {
    return this.stockEntryRepository.findOne({
      where: { id },
      relations: ['stockEntryItems', 'stockEntryItems.inventory'],
    });
  }

  async update(
    id: string,
    updateData: Partial<ImportStockEntryRequestDto>,
  ): Promise<StockEntry | null> {
    await this.stockEntryRepository.update(id, updateData);
    return this.findById(id);
  }

  async updateStatus(
    id: string,
    status: StockEntryStatus,
  ): Promise<StockEntry> {
    await this.stockEntryRepository.update(id, { status });
    const updatedStockEntry = await this.findById(id);
    if (!updatedStockEntry) {
      throw new Error('Stock entry not found');
    }
    return updatedStockEntry;
  }

  async filter(filter: FilterStockEntryRequestDto): Promise<StockEntry[]> {
    const queryBuilder = this.stockEntryRepository
      .createQueryBuilder('stockEntry')
      .leftJoinAndSelect('stockEntry.stockEntryItems', 'stockEntryItems')
      .leftJoinAndSelect('stockEntryItems.inventory', 'inventory')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.variant', 'variant');

    if (filter.id) {
      queryBuilder.andWhere('stockEntry.id = :id', { id: filter.id });
    }

    if (filter.status) {
      queryBuilder.andWhere('stockEntry.status = :status', {
        status: filter.status,
      });
    }

    if (filter.supplierName) {
      queryBuilder.andWhere('stockEntry.supplierName ILIKE :supplierName', {
        supplierName: `%${filter.supplierName}%`,
      });
    }

    if (filter.warehouseName) {
      queryBuilder.andWhere('warehouse.name ILIKE :warehouseName', {
        warehouseName: `%${filter.warehouseName}%`,
      });
    }

    if (filter.variantId) {
      queryBuilder.andWhere('variant.id = :variantId', {
        variantId: filter.variantId,
      });
    }

    const sortBy = filter.sortBy || 'updatedAt';
    const sort = filter.sort || 'DESC';
    queryBuilder.orderBy(
      `stockEntry.${sortBy}`,
      sort.toUpperCase() as 'ASC' | 'DESC',
    );

    return queryBuilder.getMany();
  }
}
