import 'reflect-metadata';
import { DataSource } from 'typeorm';
import User from '../models/user.model';
import { config } from './env';
import Address from '../models/address.model';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';
import { Variant } from '../models/variant.model';
import { Color } from '../models/color.model';
import { Order } from '../models/order.model';
import { OrderItem } from '../models/order_item.model';
import { OrderShippingAddress } from '../models/order_shipping_address.model';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.pg.host,
  port: config.pg.port,
  username: config.pg.user,
  password: config.pg.password,
  database: config.pg.database,
  entities: [
    User,
    Address,
    Category,
    Product,
    Color,
    Variant,
    Order,
    OrderItem,
    OrderShippingAddress,
  ],
  synchronize: true,
  logging: false,
});
