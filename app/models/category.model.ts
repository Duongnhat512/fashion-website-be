import { IsOptional } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  iconUrl: string;

  @Column({ type: 'varchar', length: 255, default: 'active' })
  status!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'boolean', default: false })
  autoGenSlug!: boolean;

  @Column({ type: 'boolean', default: false })
  autoGenSeoTitle!: boolean;

  @Column({ type: 'boolean', default: false })
  autoGenSeoDescription!: boolean;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'int', default: 0 })
  level!: number;

  @Column({ type: 'varchar', length: 255 })
  layout!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsOptional()
  parentId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
