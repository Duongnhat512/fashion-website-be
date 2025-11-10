import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Color } from './color.model';
import { Product } from './product.model';
import { OrderItem } from './order_item.model';
import CartItem from './cart_item.model';

@Entity({ name: 'variants' })
export class Variant {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 255 })
  sku!: string;

  @ManyToOne(() => Color, (color) => color.variants)
  @JoinColumn({ name: 'color_id' })
  color!: Color;

  @Column({ type: 'varchar', length: 255 })
  size!: string;

  @Column({ type: 'float' })
  price!: number;

  @Column({ type: 'float', name: 'discount_price' })
  discountPrice!: number;

  @Column({ type: 'float', name: 'discount_percent', default: 0 })
  discountPercent!: number;

  @Column({ type: 'varchar', length: 255, name: 'image_url' })
  imageUrl!: string;

  @Column({ type: 'boolean', name: 'on_sales' })
  onSales!: boolean;

  @Column({ type: 'varchar', length: 255, name: 'sale_note' })
  saleNote!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.variant)
  orderItems!: OrderItem[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.variant)
  cartItems?: CartItem[];

  @BeforeInsert()
  async generateCode() {
    const hrTime = process.hrtime.bigint();
    const random = Math.random().toString(36).substring(2, 7);
    this.id = `VAR-${hrTime}-${random}`.toUpperCase();
  }

  constructor(id: string) {
    this.id = id;
  }
}
