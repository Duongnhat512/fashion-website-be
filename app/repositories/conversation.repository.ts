import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { Conversation } from '../models/conversation.model';
import ConversationType from '../models/enum/conversation_type.enum';
import ConversationStatus from '../models/enum/conversation_status.enum';
import { ChatMessage } from '../models/chat_message.model';

export class ConversationRepository {
  private readonly conversationRepository: Repository<Conversation>;

  constructor() {
    this.conversationRepository = AppDataSource.getRepository(Conversation);
  }

  async create(conversation: Partial<Conversation>): Promise<Conversation> {
    return this.conversationRepository.save(conversation);
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: { id },
      relations: ['user', 'agent'],
    });
  }

  async findByUserId(userId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      relations: ['user', 'agent'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findActiveByUserId(userId: string): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: {
        userId,
        status: ConversationStatus.ACTIVE,
      },
      relations: ['user', 'agent'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findByAgentId(agentId: string): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: { agentId },
      relations: ['user', 'agent'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findWaitingConversations(): Promise<Conversation[]> {
    return this.conversationRepository.find({
      where: {
        status: ConversationStatus.WAITING,
        conversationType: ConversationType.HUMAN,
      },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(conversation: Conversation): Promise<Conversation> {
    return this.conversationRepository.save(conversation);
  }

  async updateLastMessage(
    conversationId: string,
    lastMessage: string,
  ): Promise<void> {
    await this.conversationRepository.update(conversationId, {
      lastMessage,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.conversationRepository.delete(id);
  }

  /**
   * Lấy tất cả conversations với thông tin unread count và reply status (cho admin)
   * @param userId - Optional: userId của admin để tính unread count chính xác
   */
  async findAllWithStats(userId?: string): Promise<
    (Conversation & {
      unreadCount: number;
      isReplied: boolean;
      lastMessageFrom: 'user' | 'agent' | 'bot';
    })[]
  > {
    const conversations = await this.conversationRepository.find({
      relations: ['user', 'agent'],
      order: { updatedAt: 'DESC' },
    });

    const messageRepository = AppDataSource.getRepository(ChatMessage);

    // Lấy thống kê cho mỗi conversation
    const conversationsWithStats = await Promise.all(
      conversations.map(async (conv) => {
        // Đếm tin nhắn chưa đọc từ user (gửi đến admin)
        let unreadCount = 0;

        if (userId) {
          // Nếu có userId, tính unread count chính xác cho admin đó
          const { ConversationReadRepository } = await import(
            './conversation_read.repository'
          );
          const readRepo = new ConversationReadRepository();
          const lastReadMessageId = await readRepo.findLastReadMessageId(
            conv.id,
            userId,
          );
          unreadCount = await this.countUnreadFromUser(
            conv.id,
            lastReadMessageId,
          );
        } else {
          // Nếu không có userId, đếm tin nhắn từ user sau tin nhắn admin/bot cuối cùng
          // Tìm tin nhắn cuối cùng từ admin/agent/bot
          const lastAdminMessage = await messageRepository.findOne({
            where: [
              {
                conversationId: conv.id,
                senderId: conv.agentId || '',
                isFromBot: false,
              },
              { conversationId: conv.id, isFromBot: true },
            ],
            order: { createdAt: 'DESC' },
          });

          if (lastAdminMessage) {
            // Đếm tin nhắn từ user sau tin nhắn admin/bot cuối
            unreadCount = await messageRepository
              .createQueryBuilder('message')
              .where('message.conversationId = :conversationId', {
                conversationId: conv.id,
              })
              .andWhere('message.senderId = :userId', { userId: conv.userId })
              .andWhere('message.isFromBot = false')
              .andWhere('message.createdAt > :lastAdminAt', {
                lastAdminAt: lastAdminMessage.createdAt,
              })
              .getCount();
          } else {
            // Chưa có admin/bot reply, đếm tất cả tin nhắn từ user
            unreadCount = await messageRepository.count({
              where: {
                conversationId: conv.id,
                senderId: conv.userId,
                isFromBot: false,
              },
            });
          }
        }

        // Lấy tin nhắn cuối cùng
        const lastMessage = await messageRepository.findOne({
          where: { conversationId: conv.id },
          order: { createdAt: 'DESC' },
        });

        let lastMessageFrom: 'user' | 'agent' | 'bot' = 'user';
        let isReplied = false;

        if (lastMessage) {
          if (lastMessage.isFromBot) {
            lastMessageFrom = 'bot';
            isReplied = true;
          } else if (lastMessage.senderId === conv.userId) {
            lastMessageFrom = 'user';
            isReplied = false;
          } else if (
            lastMessage.senderId &&
            lastMessage.senderId !== conv.userId
          ) {
            lastMessageFrom = 'agent';
            isReplied = true;
          }
        }

        return {
          ...conv,
          unreadCount,
          isReplied,
          lastMessageFrom,
        };
      }),
    );

    return conversationsWithStats;
  }

  /**
   * Đếm số tin nhắn chưa đọc từ user trong conversation
   */
  async countUnreadFromUser(
    conversationId: string,
    lastReadMessageId?: string | null,
  ): Promise<number> {
    const messageRepository = AppDataSource.getRepository(ChatMessage);
    const conversation = await this.findById(conversationId);

    if (!conversation) {
      return 0;
    }

    let query = messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.senderId = :userId', { userId: conversation.userId })
      .andWhere('message.isFromBot = false');

    // Nếu có lastReadMessageId, chỉ đếm tin nhắn sau đó
    if (lastReadMessageId) {
      const lastReadMessage = await messageRepository.findOne({
        where: { id: lastReadMessageId },
      });
      if (lastReadMessage) {
        query = query.andWhere('message.createdAt > :lastReadAt', {
          lastReadAt: lastReadMessage.createdAt,
        });
      }
    }

    return query.getCount();
  }

  /**
   * Kiểm tra conversation đã được reply chưa
   */
  async isReplied(conversationId: string): Promise<boolean> {
    const messageRepository = AppDataSource.getRepository(ChatMessage);
    const conversation = await this.findById(conversationId);

    if (!conversation) {
      return false;
    }

    const lastMessage = await messageRepository.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
    });

    if (!lastMessage) {
      return false;
    }

    // Nếu tin nhắn cuối cùng từ bot hoặc agent (không phải user) thì đã được reply
    return (
      lastMessage.isFromBot ||
      (lastMessage.senderId !== null &&
        lastMessage.senderId !== conversation.userId)
    );
  }
}
