import { IsOptional } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.model';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name!: string;

  @Column({ type: 'varchar', length: 255, name: 'icon_url', nullable: true })
  iconUrl: string;

  @Column({ type: 'varchar', length: 255, default: 'active', name: 'status' })
  status!: string;

  @Column({ type: 'varchar', length: 255, name: 'slug' })
  slug!: string;

  @Column({ type: 'boolean', default: false, name: 'auto_gen_slug' })
  autoGenSlug!: boolean;

  @Column({ type: 'boolean', default: false, name: 'auto_gen_seo_title' })
  autoGenSeoTitle!: boolean;

  @Column({ type: 'boolean', default: false, name: 'auto_gen_seo_description' })
  autoGenSeoDescription!: boolean;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'int', default: 0 })
  level!: number;

  @Column({ type: 'varchar', length: 255 })
  layout!: string;

  @Column({ type: 'varchar', length: 255, name: 'parent_id', nullable: true })
  @IsOptional()
  parentId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
