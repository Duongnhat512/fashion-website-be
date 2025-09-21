import { IsOptional } from 'class-validator';
import { Category } from './category.model';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Variant } from './variant.model';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'varchar', length: 255, name: 'short_description' })
  shortDescription!: string;

  @Column({ type: 'varchar', length: 255, name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  brand?: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Column({ type: 'varchar', length: 255, default: 'active' })
  status!: string;

  @Column({ type: 'varchar', length: 255, default: '[]' })
  tags!: string;

  @Column({ type: 'float', default: 0, name: 'rating_average' })
  ratingAverage!: number;

  @Column({ type: 'int', default: 0, name: 'rating_count' })
  ratingCount!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Variant, (variant) => variant.product)
  variants!: Variant[];
}
