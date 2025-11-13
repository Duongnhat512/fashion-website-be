import redis from '../../../config/redis.config';
import {
  ChatMessage,
  IConversationMemoryService,
} from '../conversation_memory.service.interface';
import logger from '../../../utils/logger';

const CONVERSATION_TTL = 3600 * 24; // 24 hours
const MAX_HISTORY_LENGTH = 50; // Maximum messages to store

export class ConversationMemoryService implements IConversationMemoryService {
  private getKey(sessionId: string): string {
    return `chatbot:conversation:${sessionId}`;
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const key = this.getKey(sessionId);
      const data = await redis.get(key);

      if (!data) {
        return [];
      }

      const history = JSON.parse(data) as ChatMessage[];
      return history;
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      return [];
    }
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const history = await this.getHistory(sessionId);

      // Add new message
      history.push(message);

      // Keep only last N messages to manage memory
      const limitedHistory = history.slice(-MAX_HISTORY_LENGTH);

      // Save back to Redis with TTL
      await redis.setex(key, CONVERSATION_TTL, JSON.stringify(limitedHistory));
    } catch (error) {
      logger.error('Error adding message to conversation:', error);
      throw error;
    }
  }

  async clearHistory(sessionId: string): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      await redis.del(key);
    } catch (error) {
      logger.error('Error clearing conversation history:', error);
      throw error;
    }
  }

  async getLimitedHistory(
    sessionId: string,
    limit: number,
  ): Promise<ChatMessage[]> {
    try {
      const history = await this.getHistory(sessionId);
      // Return last N messages
      return history.slice(-limit);
    } catch (error) {
      logger.error('Error getting limited history:', error);
      return [];
    }
  }
}
