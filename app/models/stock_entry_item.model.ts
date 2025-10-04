// app/models/stock_entry_item.model.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @Column({ type: 'double precision', name: 'rate' })
  rate!: number;

  @Column({ type: 'int', name: 'quantity' })
  quantity!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note?: string;

  @Column({ type: 'double precision', name: 'amount' })
  amount!: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
