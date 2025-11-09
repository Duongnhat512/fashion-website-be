import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  import { Promotion } from './promotion.model';
  import { Product } from './product.model';
  
  @Entity({ name: 'promotion_products' })
  export class PromotionProduct {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @ManyToOne(() => Promotion, (promotion) => promotion.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'promotion_id' })
    @Index()
    promotion!: Promotion;
  
    @ManyToOne(() => Product, (product) => product.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    @Index()
    product!: Product;
  
    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;
  }