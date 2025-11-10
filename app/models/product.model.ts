import { IsOptional } from 'class-validator';
import { Category } from './category.model';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';
import { Variant } from './variant.model';
import { OrderItem } from './order_item.model';
import CartItem from './cart_item.model';
import { Review } from './review.model';

@Entity({ name: 'products' })
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 255 })
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

  @OneToMany(() => Variant, (variant) => variant.product, { cascade: true })
  variants!: Variant[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems?: OrderItem[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product, { cascade: true })
  cartItems?: CartItem[];

  @OneToMany(() => Review, (review) => review.product)
  reviews?: Review[];

  @BeforeInsert()
  async generateCode() {
    const hrTime = process.hrtime.bigint();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();

    this.id = `PRO-${hrTime}-${random}`;
  }

  constructor(id: string) {
    this.id = id;
  }
}
