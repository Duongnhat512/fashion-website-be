import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { authenticatedUser } from '../middlewares/auth.middleware';

const router = Router();
const chatbotController = new ChatbotController();

// Chat endpoint - requires authentication
router.post('/chat', authenticatedUser, chatbotController.chat);

// Clear conversation history
router.post('/clear', authenticatedUser, chatbotController.clearHistory);

export default router;
