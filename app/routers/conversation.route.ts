import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const conversationController = new ConversationController();

// Lấy hoặc tạo conversation đang active
router.get(
  '/active',
  authenticatedUser,
  conversationController.getOrCreateActive,
);

// Lấy tất cả conversations của user
router.get('/', authenticatedUser, conversationController.getUserConversations);

// Lấy conversation theo ID
router.get(
  '/:id',
  authenticatedUser,
  conversationController.getConversationById,
);

// Lấy messages của conversation
router.get(
  '/:id/messages',
  authenticatedUser,
  conversationController.getConversationMessages,
);

// Chuyển đổi sang chat với nhân viên
router.post(
  '/:id/switch-to-human',
  authenticatedUser,
  conversationController.switchToHuman,
);

// Chuyển đổi về chat với bot
router.post(
  '/:id/switch-to-bot',
  authenticatedUser,
  conversationController.switchToBot,
);

// Assign nhân viên cho conversation (admin only)
router.post(
  '/:id/assign-agent',
  authenticatedUser,
  conversationController.assignAgent,
);

// Lấy các conversations đang chờ nhân viên (admin only)
router.get(
  '/waiting',
  authenticatedUser,
  conversationController.getWaitingConversations,
);

// Lấy conversations của nhân viên (admin only)
router.get(
  '/agent/my-conversations',
  authenticatedUser,
  conversationController.getAgentConversations,
);

// Lấy tất cả conversations với thống kê (admin only)
router.get(
  '/admin/all',
  authenticatedUser,
  conversationController.getAllConversationsWithStats,
);

// Đánh dấu conversation đã đọc (admin only)
router.post(
  '/:id/mark-as-read',
  authenticatedUser,
  conversationController.markAsRead,
);

// Lấy thống kê của conversation (admin only)
router.get(
  '/:id/stats',
  authenticatedUser,
  conversationController.getConversationStats,
);

export default router;
