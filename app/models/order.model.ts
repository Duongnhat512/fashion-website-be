import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import User from './user.model';
import OrderStatus from './enum/order_status.enum';
import { OrderItem } from './order_item.model';
import { OrderShippingAddress } from './order_shipping_address.model';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.UNPAID })
  status: OrderStatus;

  @Column({ type: 'double precision', name: 'sub_total' })
  subTotal: number;

  @Column({ type: 'float', name: 'discount' })
  discount: number;

  @Column({ type: 'double precision', name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'double precision', name: 'shipping_fee' })
  shippingFee: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(
    () => OrderShippingAddress,
    (shippingAddress) => shippingAddress.order,
    { cascade: true },
  )
  shippingAddress: OrderShippingAddress;
}
