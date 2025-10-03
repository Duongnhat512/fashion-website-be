import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockEntryType } from './enum/stock_entry_type,enum';
import { StockEntryStatus } from './enum/stock_entry_status.enum';
import { StockEntryItem } from './stock_entry_item.model';

@Entity({ name: 'stock_entries' })
@Index(['createdAt'])
export class StockEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: StockEntryType,
    default: StockEntryType.IMPORT,
  })
  type!: StockEntryType;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'supplier_name',
    nullable: true,
  })
  supplierName?: string;

  @Column({
    type: 'enum',
    enum: StockEntryStatus,
    default: StockEntryStatus.DRAFT,
  })
  status!: StockEntryStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note?: string;

  @Column({ type: 'double precision', name: 'total_cost' })
  totalCost!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => StockEntryItem, (item) => item.stockEntry, {
    cascade: true,
  })
  stockEntryItems!: StockEntryItem[];
}
