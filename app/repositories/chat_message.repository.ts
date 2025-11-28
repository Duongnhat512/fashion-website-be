import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { ChatMessage } from '../models/chat_message.model';

export class ChatMessageRepository {
  private readonly messageRepository: Repository<ChatMessage>;

  constructor() {
    this.messageRepository = AppDataSource.getRepository(ChatMessage);
  }

  async create(message: Partial<ChatMessage>): Promise<ChatMessage> {
    return this.messageRepository.save(message);
  }

  async findByConversationId(
    conversationId: string,
    limit?: number,
  ): Promise<ChatMessage[]> {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .leftJoinAndSelect('message.sender', 'sender')
      .orderBy('message.createdAt', 'ASC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  async findById(id: string): Promise<ChatMessage | null> {
    return this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'conversation'],
    });
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.messageRepository.update(
      {
        conversationId,
        senderId: userId,
        isRead: false,
      },
      {
        isRead: true,
      },
    );
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    return this.messageRepository.count({
      where: {
        conversationId,
        senderId: userId,
        isRead: false,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.messageRepository.delete(id);
  }
}

