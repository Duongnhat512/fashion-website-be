import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Inventory } from './inventory.model';
import { StockEntryType } from './enum/stock_entry_type,enum';

@Entity({ name: 'stock_entries' })
@Index(['inventory'])
@Index(['createdAt'])
export class StockEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Inventory, (inv) => inv.entries)
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

  @Column({ type: 'enum', enum: StockEntryType })
  type!: StockEntryType;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
