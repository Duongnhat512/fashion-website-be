import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import User from './user.model';
import ConversationType from './enum/conversation_type.enum';
import ConversationStatus from './enum/conversation_status.enum';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  // Nhân viên đang xử lý conversation (null nếu đang chat với bot)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'agent_id' })
  agent?: User | null;

  @Column({ type: 'uuid', nullable: true, name: 'agent_id' })
  agentId?: string | null;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.BOT,
    name: 'conversation_type',
  })
  conversationType!: ConversationType;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string; // Tiêu đề conversation (có thể tự động tạo từ tin nhắn đầu tiên)

  @Column({ type: 'text', nullable: true })
  lastMessage?: string; // Tin nhắn cuối cùng để hiển thị preview

  @Index()
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany('ChatMessage', 'conversation')
  messages!: any[];
}

