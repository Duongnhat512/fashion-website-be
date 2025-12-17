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
import { Warehouse } from '../models/warehouse.model';
import { StockEntry } from '../models/stock_entry.model';
import { Inventory } from '../models/inventory.model';
import { StockEntryItem } from '../models/stock_entry_item.model';
import Cart from '../models/cart.model';
import CartItem from '../models/cart_item.model';
import { Promotion } from '../models/promotion.model';
import { PromotionProduct } from '../models/promotion_product.model';
import { Review } from '../models/review.model';
import { Conversation } from '../models/conversation.model';
import { ChatMessage } from '../models/chat_message.model';
import { ConversationRead } from '../models/conversation_read.model';
import { Voucher } from '../models/voucher.model';
import { VoucherUsage } from '../models/voucher_usage.model';

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
    Warehouse,
    StockEntry,
    Inventory,
    StockEntryItem,
    Cart,
    CartItem,
    Promotion,
    PromotionProduct,
    Review,
    Conversation,
    ChatMessage,
    ConversationRead,
    Voucher,
    VoucherUsage,
  ],
  synchronize: true,
  logging: false,
  ssl:
    config.nodeEnv === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
