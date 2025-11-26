import {
  IChatMessageService,
  CreateChatMessageDto,
} from '../chat_message.service.interface';
import { ChatMessageRepository } from '../../../repositories/chat_message.repository';
import { ConversationRepository } from '../../../repositories/conversation.repository';
import { ChatMessage } from '../../../models/chat_message.model';
import MessageType from '../../../models/enum/message_type.enum';
import logger from '../../../utils/logger';

export class ChatMessageService implements IChatMessageService {
  private readonly messageRepository: ChatMessageRepository;
  private readonly conversationRepository: ConversationRepository;

  constructor() {
    this.messageRepository = new ChatMessageRepository();
    this.conversationRepository = new ConversationRepository();
  }

  async createMessage(message: CreateChatMessageDto): Promise<ChatMessage> {
    try {
      const chatMessage = await this.messageRepository.create({
        conversationId: message.conversationId,
        senderId: message.senderId || null,
        content: message.content,
        messageType: message.messageType || MessageType.TEXT,
        isFromBot: message.isFromBot || false,
        metadata: message.metadata || undefined,
      });

      // Cập nhật lastMessage của conversation
      await this.conversationRepository.updateLastMessage(
        message.conversationId,
        message.content,
      );

      return chatMessage;
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  async getConversationMessages(
    conversationId: string,
    limit?: number,
  ): Promise<ChatMessage[]> {
    try {
      return await this.messageRepository.findByConversationId(
        conversationId,
        limit,
      );
    } catch (error) {
      logger.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    try {
      return await this.messageRepository.findById(messageId);
    } catch (error) {
      logger.error('Error getting message by id:', error);
      throw error;
    }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await this.messageRepository.markAsRead(conversationId, userId);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    try {
      return await this.messageRepository.countUnread(conversationId, userId);
    } catch (error) {
      logger.error('Error counting unread messages:', error);
      throw error;
    }
  }
}
