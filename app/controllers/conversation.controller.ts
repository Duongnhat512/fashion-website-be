import { Request, Response } from 'express';
import { ConversationService } from '../services/conversation/implements/conversation.service.implement';
import { ChatMessageService } from '../services/chat_message/implements/chat_message.service.implement';
import logger from '../utils/logger';

export class ConversationController {
  private conversationService: ConversationService;
  private chatMessageService: ChatMessageService;

  constructor() {
    this.conversationService = new ConversationService();
    this.chatMessageService = new ChatMessageService();
  }

  /**
   * Lấy hoặc tạo conversation đang active
   * GET /api/v1/conversations/active
   */
  getOrCreateActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const conversation =
        await this.conversationService.getOrCreateActiveConversation(userId);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      logger.error('Error getting active conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Lấy tất cả conversations của user
   * GET /api/v1/conversations
   */
  getUserConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const conversations = await this.conversationService.getUserConversations(
        userId,
      );

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Lấy conversation theo ID
   * GET /api/v1/conversations/:id
   */
  getConversationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const conversation = await this.conversationService.getConversationById(
        id,
      );

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
        return;
      }

      // Kiểm tra quyền truy cập
      if (
        conversation.userId !== userId &&
        conversation.agentId !== userId &&
        userRole !== 'admin'
      ) {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
        return;
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      logger.error('Error getting conversation by id:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Lấy messages của conversation
   * GET /api/v1/conversations/:id/messages
   */
  getConversationMessages = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      // Kiểm tra quyền truy cập conversation
      const conversation = await this.conversationService.getConversationById(
        id,
      );

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
        return;
      }

      if (
        conversation.userId !== userId &&
        conversation.agentId !== userId &&
        userRole !== 'admin'
      ) {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
        return;
      }

      const messages = await this.chatMessageService.getConversationMessages(
        id,
        limit,
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      logger.error('Error getting conversation messages:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Chuyển đổi sang chat với nhân viên
   * POST /api/v1/conversations/:id/switch-to-human
   */
  switchToHuman = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      const conversation = await this.conversationService.getConversationById(
        id,
      );

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
        return;
      }

      if (conversation.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
        return;
      }

      const updatedConversation = await this.conversationService.switchToHuman(
        id,
      );

      res.json({
        success: true,
        data: updatedConversation,
        message: 'Switched to human chat',
      });
    } catch (error) {
      logger.error('Error switching to human:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Chuyển đổi về chat với bot
   * POST /api/v1/conversations/:id/switch-to-bot
   */
  switchToBot = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      const conversation = await this.conversationService.getConversationById(
        id,
      );

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
        return;
      }

      if (conversation.userId !== userId && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
        return;
      }

      const updatedConversation = await this.conversationService.switchToBot(
        id,
      );

      res.json({
        success: true,
        data: updatedConversation,
        message: 'Switched to bot chat',
      });
    } catch (error) {
      logger.error('Error switching to bot:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Assign nhân viên cho conversation (admin only)
   * POST /api/v1/conversations/:id/assign-agent
   */
  assignAgent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { agentId } = req.body;
      const userRole = (req as any).user?.role;

      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Admin only',
        });
        return;
      }

      if (!agentId) {
        res.status(400).json({
          success: false,
          message: 'AgentId is required',
        });
        return;
      }

      const updatedConversation = await this.conversationService.assignAgent(
        id,
        agentId,
      );

      res.json({
        success: true,
        data: updatedConversation,
        message: 'Agent assigned successfully',
      });
    } catch (error) {
      logger.error('Error assigning agent:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Lấy các conversations đang chờ nhân viên (admin only)
   * GET /api/v1/conversations/waiting
   */
  getWaitingConversations = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userRole = (req as any).user?.role;

      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Admin only',
        });
        return;
      }

      const conversations =
        await this.conversationService.getWaitingConversations();

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error('Error getting waiting conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Lấy conversations của nhân viên
   * GET /api/v1/conversations/agent/my-conversations
   */
  getAgentConversations = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const agentId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Admin only',
        });
        return;
      }

      const conversations =
        await this.conversationService.getAgentConversations(agentId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error('Error getting agent conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Lấy tất cả conversations với thống kê (unread, reply status) - Admin only
   * GET /api/v1/conversations/admin/all
   */
  getAllConversationsWithStats = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.userId; // Lấy userId của admin

      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Admin only',
        });
        return;
      }

      const conversations =
        await this.conversationService.getAllConversationsWithStats(userId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error('Error getting all conversations with stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Đánh dấu conversation đã đọc bởi admin/agent
   * POST /api/v1/conversations/:id/mark-as-read
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const { lastReadMessageId } = req.body;

      // Chỉ admin/agent mới có thể đánh dấu đã đọc
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Admin only',
        });
        return;
      }

      await this.conversationService.markAsReadByUser(
        id,
        userId,
        lastReadMessageId,
      );

      res.json({
        success: true,
        message: 'Conversation marked as read',
      });
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Lấy thống kê unread và reply status của một conversation - Admin only
   * GET /api/v1/conversations/:id/stats
   */
  getConversationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.userId;

      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Admin only',
        });
        return;
      }

      // Đếm tin nhắn chưa đọc
      const { ConversationReadRepository } = await import(
        '../repositories/conversation_read.repository'
      );
      const readRepo = new ConversationReadRepository();
      const lastReadMessageId = await readRepo.findLastReadMessageId(
        id,
        userId,
      );

      const unreadCount = await this.conversationService.countUnreadFromUser(
        id,
        lastReadMessageId,
      );

      const isReplied = await this.conversationService.isReplied(id);

      res.json({
        success: true,
        data: {
          conversationId: id,
          unreadCount,
          isReplied,
          lastReadMessageId,
        },
      });
    } catch (error) {
      logger.error('Error getting conversation stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}
