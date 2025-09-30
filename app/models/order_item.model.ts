import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.model';
import { Product } from './product.model';
import { Variant } from './variant.model';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  product: Product;

  @ManyToOne(() => Variant, (variant) => variant.orderItems)
  variant: Variant;

  @Column({ type: 'int', name: 'quantity' })
  quantity: number;

  @Column({ type: 'double precision', name: 'price' })
  price: number;
}
