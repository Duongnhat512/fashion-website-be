import {
  CreateDateColumn,
  Column,
  JoinColumn,
  UpdateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Entity,
} from 'typeorm';
import { Product } from './product.model';
import { Variant } from './variant.model';
import Cart from './cart.model';

@Entity({ name: 'cart_items' })
class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, (product) => product.cartItems)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Variant, (variant) => variant.cartItems)
  @JoinColumn({ name: 'variant_id' })
  variant!: Variant;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Cart, (cart) => cart.cartItems)
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;
}

export default CartItem;
