@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, (product) => product.reviews)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'jsonb', nullable: true })
  images?: string[];

  // ✔ A reply belongs to one review
  @ManyToOne(() => Review, (review) => review.replies, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo?: Review;

  // ✔ A review can have many replies
  @OneToMany(() => Review, (review) => review.replyTo)
  replies?: Review[];

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
