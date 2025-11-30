import { Conversation } from '../../models/conversation.model';
import ConversationType from '../../models/enum/conversation_type.enum';
import ConversationStatus from '../../models/enum/conversation_status.enum';

export interface IConversationService {
  /**
   * Tạo conversation mới hoặc lấy conversation đang active
   * @param userId - ID của user
   * @returns Conversation
   */
  getOrCreateActiveConversation(userId: string): Promise<Conversation>;

  /**
   * Lấy conversation theo ID
   */
  getConversationById(conversationId: string): Promise<Conversation | null>;

  /**
   * Lấy tất cả conversations của user
   */
  getUserConversations(userId: string): Promise<Conversation[]>;

  /**
   * Chuyển đổi từ bot sang human (nhân viên)
   */
  switchToHuman(
    conversationId: string,
    agentId?: string,
  ): Promise<Conversation>;

  /**
   * Chuyển đổi từ human sang bot
   */
  switchToBot(conversationId: string): Promise<Conversation>;

  /**
   * Assign nhân viên cho conversation
   */
  assignAgent(conversationId: string, agentId: string): Promise<Conversation>;

  /**
   * Lấy các conversations đang chờ nhân viên xử lý
   */
  getWaitingConversations(): Promise<Conversation[]>;

  /**
   * Cập nhật status của conversation
   */
  updateStatus(
    conversationId: string,
    status: ConversationStatus,
  ): Promise<Conversation>;

  /**
   * Lấy conversations của nhân viên
   */
  getAgentConversations(agentId: string): Promise<Conversation[]>;

  /**
   * Lấy tất cả conversations với thống kê (unread, reply status) - cho admin
   * @param userId - Optional: userId của admin để tính unread count chính xác
   */
  getAllConversationsWithStats(userId?: string): Promise<
    (Conversation & {
      unreadCount: number;
      isReplied: boolean;
      lastMessageFrom: 'user' | 'agent' | 'bot';
    })[]
  >;

  /**
   * Đếm số tin nhắn chưa đọc từ user trong conversation
   */
  countUnreadFromUser(
    conversationId: string,
    lastReadMessageId?: string | null,
  ): Promise<number>;

  /**
   * Kiểm tra conversation đã được reply chưa
   */
  isReplied(conversationId: string): Promise<boolean>;

  /**
   * Đánh dấu admin/agent đã đọc conversation
   */
  markAsReadByUser(
    conversationId: string,
    userId: string,
    lastReadMessageId?: string,
  ): Promise<void>;
}
