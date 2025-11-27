import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VoucherUsage } from './voucher_usage.model';
import { Order } from './order.model';

@Entity({ name: 'vouchers' })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'float', name: 'discount_percentage' })
  discountPercentage!: number;

  @Column({
    type: 'double precision',
    name: 'max_discount_value',
    nullable: true,
  })
  maxDiscountValue?: number | null;

  @Column({
    type: 'double precision',
    name: 'min_order_value',
    default: 0,
  })
  minOrderValue!: number;

  @Column({ type: 'int', name: 'usage_limit', nullable: true })
  usageLimit?: number | null;

  @Column({ type: 'int', name: 'usage_limit_per_user', nullable: true })
  usageLimitPerUser?: number | null;

  @Column({ type: 'int', name: 'used_count', default: 0 })
  usedCount!: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', name: 'is_stackable', default: false })
  isStackable!: boolean;

  @Column({ type: 'timestamptz', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'timestamptz', name: 'end_date' })
  endDate!: Date;

  @Column({ type: 'varchar', length: 255, name: 'created_by', nullable: true })
  createdBy?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => VoucherUsage, (usage) => usage.voucher)
  usages?: VoucherUsage[];

  @OneToMany(() => Order, (order) => order.voucher)
  orders?: Order[];
}
