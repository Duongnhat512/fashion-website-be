import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.model';

@Entity('order_shipping_addresses')
export class OrderShippingAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Order, (order) => order.shippingAddress)
  order: Order;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 255, name: 'phone' })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'full_address' })
  fullAddress: string;

  @Column({ type: 'varchar', length: 255, name: 'city' })
  city: string;

  @Column({ type: 'varchar', length: 255, name: 'district' })
  district: string;

  @Column({ type: 'varchar', length: 255, name: 'ward' })
  ward: string;
}
