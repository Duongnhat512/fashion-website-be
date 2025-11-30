import { ChatMessage } from '../../models/chat_message.model';
import MessageType from '../../models/enum/message_type.enum';

export interface CreateChatMessageDto {
  conversationId: string;
  senderId?: string | null;
  content: string;
  messageType?: MessageType;
  isFromBot?: boolean;
  metadata?: Record<string, any>;
}

export interface IChatMessageService {
  /**
   * Tạo tin nhắn mới
   */
  createMessage(message: CreateChatMessageDto): Promise<ChatMessage>;

  /**
   * Lấy tất cả tin nhắn trong conversation
   */
  getConversationMessages(
    conversationId: string,
    limit?: number,
  ): Promise<ChatMessage[]>;

  /**
   * Lấy tin nhắn theo ID
   */
  getMessageById(messageId: string): Promise<ChatMessage | null>;

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  markAsRead(conversationId: string, userId: string): Promise<void>;

  /**
   * Đếm số tin nhắn chưa đọc
   */
  countUnread(conversationId: string, userId: string): Promise<number>;
}
