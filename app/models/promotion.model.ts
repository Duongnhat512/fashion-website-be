import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import PromotionType from './enum/promotional_type.enum';
import { PromotionProduct } from './promotion_product.model';
import { Category } from './category.model';
import PromotionStatus from './enum/promotion.enum';

@Entity({ name: 'promotions' })
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => PromotionProduct, (pp) => pp.promotion, { cascade: true })
  promotionProducts!: PromotionProduct[];

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  @Index()
  category?: Category;

  @Column({ type: 'enum', enum: PromotionType, name: 'type' })
  type!: PromotionType;

  @Column({ type: 'float', name: 'value' })
  value!: number;

  @Column({ type: 'varchar', length: 255, name: 'name', nullable: true })
  name?: string;

  @Column({ type: 'timestamptz', name: 'start_date', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamptz', name: 'end_date', nullable: true })
  endDate?: Date;

  @Column({ type: 'boolean', name: 'active', default: true })
  active!: boolean;

  @Column({ type: 'varchar', length: 255, name: 'note', nullable: true })
  note?: string;

  @Column({
    type: 'enum',
    enum: PromotionStatus,
    name: 'status',
    default: PromotionStatus.DRAFT,
  })
  status!: PromotionStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}