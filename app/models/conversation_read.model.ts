import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Conversation } from './conversation.model';
import User from './user.model';

/**
 * Track việc admin/agent đã đọc conversation đến tin nhắn nào
 */
@Entity({ name: 'conversation_reads' })
@Unique(['conversationId', 'userId'])
export class ConversationRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Conversation, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId!: string;

  // User đã đọc (admin/agent)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  // ID của tin nhắn cuối cùng đã đọc
  @Column({ type: 'uuid', nullable: true, name: 'last_read_message_id' })
  lastReadMessageId?: string | null;

  // Thời điểm đọc lần cuối
  @Index()
  @UpdateDateColumn({ type: 'timestamptz', name: 'last_read_at' })
  lastReadAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}

