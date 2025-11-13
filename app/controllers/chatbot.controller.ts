import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot/implements/chatbot.service.implement';
import logger from '../utils/logger';

export class ChatbotController {
  private chatbotService: ChatbotService;

  constructor() {
    this.chatbotService = new ChatbotService();
  }

  /**
   * Handle chatbot chat request
   * POST /api/v1/chatbot/chat
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, sessionId } = req.body;
      const userId = (req as any).user?.userId || req.body.userId;

      if (!message || !userId) {
        res.status(400).json({
          success: false,
          message: 'Message and userId are required',
        });
        return;
      }

      const response = await this.chatbotService.chat({
        message,
        userId,
        sessionId: sessionId || userId,
      });

      res.json({
        success: true,
        data: response,
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
