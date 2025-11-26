import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { ConversationRead } from '../models/conversation_read.model';

export class ConversationReadRepository {
  private readonly readRepository: Repository<ConversationRead>;

  constructor() {
    this.readRepository = AppDataSource.getRepository(ConversationRead);
  }

  async createOrUpdate(
    conversationId: string,
    userId: string,
    lastReadMessageId?: string,
  ): Promise<ConversationRead> {
    const existing = await this.readRepository.findOne({
      where: {
        conversationId,
        userId,
      },
    });

    if (existing) {
      existing.lastReadMessageId = lastReadMessageId || existing.lastReadMessageId;
      existing.lastReadAt = new Date();
      return this.readRepository.save(existing);
    }

    return this.readRepository.save({
      conversationId,
      userId,
      lastReadMessageId: lastReadMessageId || null,
    });
  }

  async findByConversationAndUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationRead | null> {
    return this.readRepository.findOne({
      where: {
        conversationId,
        userId,
      },
    });
  }

  async findLastReadMessageId(
    conversationId: string,
    userId: string,
  ): Promise<string | null> {
    const read = await this.findByConversationAndUser(conversationId, userId);
    return read?.lastReadMessageId || null;
  }
}

