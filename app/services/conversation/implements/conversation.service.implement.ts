import { IConversationService } from '../conversation.service.interface';
import { ConversationRepository } from '../../../repositories/conversation.repository';
import { ConversationReadRepository } from '../../../repositories/conversation_read.repository';
import { Conversation } from '../../../models/conversation.model';
import ConversationType from '../../../models/enum/conversation_type.enum';
import ConversationStatus from '../../../models/enum/conversation_status.enum';
import logger from '../../../utils/logger';

export class ConversationService implements IConversationService {
  private readonly conversationRepository: ConversationRepository;
  private readonly conversationReadRepository: ConversationReadRepository;

  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.conversationReadRepository = new ConversationReadRepository();
  }

  async getOrCreateActiveConversation(
    userId: string,
  ): Promise<Conversation> {
    try {
      // Tìm conversation đang active
      let conversation =
        await this.conversationRepository.findActiveByUserId(userId);

      // Nếu chưa có, tạo mới
      if (!conversation) {
        conversation = await this.conversationRepository.create({
          userId,
          conversationType: ConversationType.BOT,
          status: ConversationStatus.ACTIVE,
        });
      }

      return conversation;
    } catch (error) {
      logger.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  async getConversationById(
    conversationId: string,
  ): Promise<Conversation | null> {
    try {
      return await this.conversationRepository.findById(conversationId);
    } catch (error) {
      logger.error('Error getting conversation by id:', error);
      throw error;
    }
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      return await this.conversationRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      throw error;
    }
  }

  async switchToHuman(
    conversationId: string,
    agentId?: string,
  ): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.conversationType = ConversationType.HUMAN;
      conversation.status = agentId
        ? ConversationStatus.ACTIVE
        : ConversationStatus.WAITING;
      conversation.agentId = agentId || null;

      return await this.conversationRepository.update(conversation);
    } catch (error) {
      logger.error('Error switching to human:', error);
      throw error;
    }
  }

  async switchToBot(conversationId: string): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.conversationType = ConversationType.BOT;
      conversation.status = ConversationStatus.ACTIVE;
      conversation.agentId = null;

      return await this.conversationRepository.update(conversation);
    } catch (error) {
      logger.error('Error switching to bot:', error);
      throw error;
    }
  }

  async assignAgent(
    conversationId: string,
    agentId: string,
  ): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.agentId = agentId;
      conversation.conversationType = ConversationType.HUMAN;
      conversation.status = ConversationStatus.ACTIVE;

      return await this.conversationRepository.update(conversation);
    } catch (error) {
      logger.error('Error assigning agent:', error);
      throw error;
    }
  }

  async getWaitingConversations(): Promise<Conversation[]> {
    try {
      return await this.conversationRepository.findWaitingConversations();
    } catch (error) {
      logger.error('Error getting waiting conversations:', error);
      throw error;
    }
  }

  async updateStatus(
    conversationId: string,
    status: ConversationStatus,
  ): Promise<Conversation> {
    try {
      const conversation = await this.conversationRepository.findById(
        conversationId,
      );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.status = status;

      return await this.conversationRepository.update(conversation);
    } catch (error) {
      logger.error('Error updating conversation status:', error);
      throw error;
    }
  }

  async getAgentConversations(agentId: string): Promise<Conversation[]> {
    try {
      return await this.conversationRepository.findByAgentId(agentId);
    } catch (error) {
      logger.error('Error getting agent conversations:', error);
      throw error;
    }
  }

  async getAllConversationsWithStats(userId?: string): Promise<
    (Conversation & {
      unreadCount: number;
      isReplied: boolean;
      lastMessageFrom: 'user' | 'agent' | 'bot';
    })[]
  > {
    try {
      return await this.conversationRepository.findAllWithStats(userId);
    } catch (error) {
      logger.error('Error getting all conversations with stats:', error);
      throw error;
    }
  }

  async countUnreadFromUser(
    conversationId: string,
    lastReadMessageId?: string | null,
  ): Promise<number> {
    try {
      return await this.conversationRepository.countUnreadFromUser(
        conversationId,
        lastReadMessageId,
      );
    } catch (error) {
      logger.error('Error counting unread from user:', error);
      throw error;
    }
  }

  async isReplied(conversationId: string): Promise<boolean> {
    try {
      return await this.conversationRepository.isReplied(conversationId);
    } catch (error) {
      logger.error('Error checking if replied:', error);
      throw error;
    }
  }

  async markAsReadByUser(
    conversationId: string,
    userId: string,
    lastReadMessageId?: string,
  ): Promise<void> {
    try {
      // Nếu không có lastReadMessageId, lấy tin nhắn cuối cùng
      if (!lastReadMessageId) {
        const { ChatMessageRepository } = await import(
          '../../../repositories/chat_message.repository'
        );
        const messageRepo = new ChatMessageRepository();
        const messages = await messageRepo.findByConversationId(
          conversationId,
          1,
        );
        if (messages.length > 0) {
          lastReadMessageId = messages[messages.length - 1].id;
        }
      }

      await this.conversationReadRepository.createOrUpdate(
        conversationId,
        userId,
        lastReadMessageId,
      );
    } catch (error) {
      logger.error('Error marking as read by user:', error);
      throw error;
    }
  }
}

