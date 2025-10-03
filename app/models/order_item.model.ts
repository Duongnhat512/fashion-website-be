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
import { Warehouse } from './warehouse.model';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Variant, (variant) => variant.orderItems)
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @Column({ type: 'int', name: 'quantity' })
  quantity: number;

  @Column({ type: 'double precision', name: 'price' })
  price: number;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.orderItems)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;
}
