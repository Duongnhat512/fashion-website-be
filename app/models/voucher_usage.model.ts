import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Voucher } from './voucher.model';
import User from './user.model';

@Entity({ name: 'voucher_usages' })
@Unique('uq_voucher_usage_user', ['voucher', 'user'])
export class VoucherUsage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Voucher, (voucher) => voucher.usages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'voucher_id' })
  voucher!: Voucher;

  @ManyToOne(() => User, (user) => user.voucherUsages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int', name: 'usage_count', default: 0 })
  usageCount!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

