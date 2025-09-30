import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Warehouse } from './warehouse.model';
import { Variant } from './variant.model';
import { StockEntry } from './stock_entry.model';

@Entity({ name: 'inventories' })
@Unique(['warehouse', 'variant'])
@Index(['variant', 'warehouse'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Warehouse, (w) => w.inventories)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @ManyToOne(() => Variant)
  @JoinColumn({ name: 'variant_id' })
  variant!: Variant;

  @Column({ type: 'int', name: 'on_hand', default: 0 })
  onHand!: number;

  @Column({ type: 'int', name: 'reserved', default: 0 })
  reserved!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => StockEntry, (e) => e.inventory)
  entries!: StockEntry[];
}
