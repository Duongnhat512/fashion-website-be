import {
  FilterStockEntryRequestDto,
  ImportStockEntryRequestDto,
} from '../dtos/request/stock_entry/stock_entry.request';
import { StockEntryResponse } from '../dtos/response/stock_entry/stock_entry.response';

export interface IStockEntryService {
  create(stockEntry: ImportStockEntryRequestDto): Promise<StockEntryResponse>;
  findAll(): Promise<StockEntryResponse[]>;
  findById(id: string): Promise<StockEntryResponse>;
  update(
    id: string,
    stockEntry: Partial<ImportStockEntryRequestDto>,
  ): Promise<StockEntryResponse>;
  summit(id: string): Promise<StockEntryResponse>;
  cancel(id: string): Promise<StockEntryResponse>;
  filter(filter: FilterStockEntryRequestDto): Promise<StockEntryResponse[]>;
}
