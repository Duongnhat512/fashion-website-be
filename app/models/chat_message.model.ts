import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.model';
import User from './user.model';
import MessageType from './enum/message_type.enum';

@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Conversation, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column({ type: 'uuid', name: 'conversation_id' })
  conversationId!: string;

  // Người gửi (user hoặc agent), null nếu là bot
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender?: User | null;

  @Column({ type: 'uuid', nullable: true, name: 'sender_id' })
  senderId?: string | null;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
    name: 'message_type',
  })
  messageType!: MessageType;

  @Column({ type: 'text' })
  content!: string; // Nội dung tin nhắn

  @Column({ type: 'boolean', default: false, name: 'is_from_bot' })
  isFromBot!: boolean; // true nếu là tin nhắn từ chatbot

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead!: boolean; // Đã đọc chưa (cho nhân viên)

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Metadata bổ sung (ví dụ: products từ chatbot)

  @Index()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}

