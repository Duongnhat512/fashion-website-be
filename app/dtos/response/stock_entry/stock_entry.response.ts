import { StockEntryType } from '../../../models/enum/stock_entry_type,enum';
import { Inventory } from '../../../models/inventory.model';
import { StockEntryStatus } from '../../../models/enum/stock_entry_status.enum';
import { StockEntryItem } from '../../../models/stock_entry_item.model';

export class StockEntryResponse {
  id: string;
  type: StockEntryType;
  supplierName: string;
  status: StockEntryStatus;
  note: string;
  totalCost: number;
  createdAt: Date;
  updatedAt: Date;
  stockEntryItems: StockEntryItem[];
}
