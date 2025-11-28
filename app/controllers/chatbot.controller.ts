import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot/implements/chatbot.service.implement';
import { ConversationService } from '../services/conversation/implements/conversation.service.implement';
import { ChatMessageService } from '../services/chat_message/implements/chat_message.service.implement';
import logger from '../utils/logger';
import MessageType from '../models/enum/message_type.enum';

export class ChatbotController {
  private chatbotService: ChatbotService;
  private conversationService: ConversationService;
  private chatMessageService: ChatMessageService;

  constructor() {
    this.chatbotService = new ChatbotService();
    this.conversationService = new ConversationService();
    this.chatMessageService = new ChatMessageService();
  }

  /**
   * Handle chatbot chat request
   * POST /api/v1/chatbot/chat
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, conversationId } = req.body;
      const userId = (req as any).user?.userId || req.body.userId;

      if (!message || !userId) {
        res.status(400).json({
          success: false,
          message: 'Message and userId are required',
        });
        return;
      }

      // Lấy hoặc tạo conversation
      let conversation;
      if (conversationId) {
        conversation = await this.conversationService.getConversationById(
          conversationId,
        );
        if (!conversation || conversation.userId !== userId) {
          res.status(403).json({
            success: false,
            message: 'Conversation not found or unauthorized',
          });
          return;
        }
      } else {
        conversation =
          await this.conversationService.getOrCreateActiveConversation(userId);
      }

      // Lưu tin nhắn user vào database
      await this.chatMessageService.createMessage({
        conversationId: conversation.id,
        senderId: userId,
        content: message,
        messageType: MessageType.TEXT,
        isFromBot: false,
      });

      // Gọi chatbot service với conversationId
      const response = await this.chatbotService.chat({
        message,
        userId,
        sessionId: conversation.id,
      });

      // Lưu phản hồi bot vào database
      if (response.message) {
        await this.chatMessageService.createMessage({
          conversationId: conversation.id,
          senderId: null,
          content: response.message,
          messageType: MessageType.TEXT,
          isFromBot: true,
          metadata: {
            products: response.products,
            requiresAction: response.requiresAction,
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...response,
          conversationId: conversation.id,
        },
      });
    } catch (error) {
      logger.error('Error in chatbot controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Clear conversation history
   * POST /api/v1/chatbot/clear
   */
  clearHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id || req.body.userId;
      const sessionId = req.body.sessionId || userId;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'SessionId is required',
        });
        return;
      }

      const { ConversationMemoryService } = await import(
        '../services/chatbot/implements/conversation_memory.service.implement'
      );
      const memoryService = new ConversationMemoryService();
      await memoryService.clearHistory(sessionId);

      res.json({
        success: true,
        message: 'Conversation history cleared',
      });
    } catch (error) {
      logger.error('Error clearing conversation history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}
