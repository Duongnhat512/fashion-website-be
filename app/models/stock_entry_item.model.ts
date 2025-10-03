// app/models/stock_entry_item.model.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockEntry } from './stock_entry.model';
import { Inventory } from './inventory.model';

@Entity({ name: 'stock_entry_items' })
export class StockEntryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => StockEntry, (stockEntry) => stockEntry.stockEntryItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stock_entry_id' })
  stockEntry!: StockEntry;

  @ManyToOne(() => Inventory)
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

  @Column({ type: 'double precision', name: 'unit_cost' })
  unitCost!: number;

  @Column({ type: 'int', name: 'quantity' })
  quantity!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note?: string;
}
