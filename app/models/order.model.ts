import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import User from './user.model';
import OrderStatus from './enum/order_status.enum';
import { OrderItem } from './order_item.model';
import { OrderShippingAddress } from './order_shipping_address.model';
import { PaymentMethod } from './enum/payment_method.enum';
import { Voucher } from './voucher.model';

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.UNPAID })
  status: OrderStatus;

  @Column({ type: 'double precision', name: 'sub_total' })
  subTotal: number;

  @Column({ type: 'float', name: 'discount' })
  discount: number;

  @Column({ type: 'boolean', name: 'is_cod' })
  isCOD: boolean;

  @Column({ type: 'double precision', name: 'total_amount' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'double precision', name: 'shipping_fee' })
  shippingFee: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.orders, { nullable: true })
  @JoinColumn({ name: 'voucher_id' })
  voucher?: Voucher | null;

  @Column({ type: 'varchar', length: 50, name: 'voucher_code', nullable: true })
  voucherCode?: string | null;

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

  @BeforeInsert()
  async generateCode() {
    const hrTime = process.hrtime.bigint();
    const random = Math.random().toString(36).substring(2, 7);
    this.id = `ORD-${hrTime}-${random}`.toUpperCase();
  }
}
