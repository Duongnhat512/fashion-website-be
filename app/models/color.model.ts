import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Variant } from './variant.model';

@Entity({ name: 'colors' })
export class Color {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  hex!: string;

  @Column({ name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'varchar', length: 255, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Variant, (variant) => variant.color)
  variants!: Variant[];
}
