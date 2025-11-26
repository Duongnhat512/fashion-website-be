import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { IWebSocketService } from '../websocket.service.interface';
import { ConversationService } from '../../conversation/implements/conversation.service.implement';
import { ChatMessageService } from '../../chat_message/implements/chat_message.service.implement';
import { ChatbotService } from '../../chatbot/implements/chatbot.service.implement';
import { AuthService } from '../../auth/implements/auth.service.implement';
import logger from '../../../utils/logger';
import ConversationType from '../../../models/enum/conversation_type.enum';
import MessageType from '../../../models/enum/message_type.enum';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class WebSocketService implements IWebSocketService {
  private conversationService: ConversationService;
  private chatMessageService: ChatMessageService;
  private chatbotService: ChatbotService;
  private authService: AuthService;

  // Map để lưu socket connections: userId -> socketId
  private userSockets: Map<string, string> = new Map();
  // Map để lưu socket rooms: conversationId -> Set<socketId>
  private conversationRooms: Map<string, Set<string>> = new Map();

  constructor() {
    this.conversationService = new ConversationService();
    this.chatMessageService = new ChatMessageService();
    this.chatbotService = new ChatbotService();
    this.authService = new AuthService();
  }

  initialize(server: HTTPServer): SocketIOServer {
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.handleConnection(io);
    return io;
  }

  handleConnection(io: SocketIOServer): void {
    io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Xác thực JWT token từ query hoặc handshake auth
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.query?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: Token required'));
        }

        // Verify token
        const decoded = this.authService.verifyAccessToken(token as string);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info(
        `WebSocket client connected: ${socket.id}, userId: ${userId}`,
      );

      // Lưu mapping userId -> socketId
      this.userSockets.set(userId, socket.id);

      // Join room của user để nhận notifications
      socket.join(`user:${userId}`);

      // Xử lý join conversation
      socket.on(
        'join_conversation',
        async (data: { conversationId: string }) => {
          try {
            const { conversationId } = data;

            // Kiểm tra quyền truy cập conversation
            const conversation =
              await this.conversationService.getConversationById(
                conversationId,
              );

            if (!conversation) {
              socket.emit('error', { message: 'Conversation not found' });
              return;
            }

            // Kiểm tra user có quyền truy cập không
            if (
              conversation.userId !== userId &&
              conversation.agentId !== userId &&
              socket.userRole !== 'admin'
            ) {
              socket.emit('error', { message: 'Unauthorized' });
              return;
            }

            // Join conversation room
            socket.join(`conversation:${conversationId}`);

            // Thêm vào conversationRooms map
            if (!this.conversationRooms.has(conversationId)) {
              this.conversationRooms.set(conversationId, new Set());
            }
            this.conversationRooms.get(conversationId)!.add(socket.id);

            // Gửi lịch sử tin nhắn
            const messages =
              await this.chatMessageService.getConversationMessages(
                conversationId,
              );

            // Nếu là admin/agent, tự động đánh dấu đã đọc conversation
            if (
              socket.userRole === 'admin' ||
              conversation.agentId === userId
            ) {
              const lastMessage = messages[messages.length - 1];
              if (lastMessage) {
                await this.conversationService.markAsReadByUser(
                  conversationId,
                  userId,
                  lastMessage.id,
                );
              }
            }

            socket.emit('conversation_history', {
              conversationId,
              messages: messages.map((msg) => ({
                id: msg.id,
                content: msg.content,
                senderId: msg.senderId,
                isFromBot: msg.isFromBot,
                createdAt: msg.createdAt,
                metadata: msg.metadata,
              })),
            });

            logger.info(`User ${userId} joined conversation ${conversationId}`);
          } catch (error) {
            logger.error('Error joining conversation:', error);
            socket.emit('error', { message: 'Failed to join conversation' });
          }
        },
      );

      // Xử lý tin nhắn mới
      socket.on(
        'send_message',
        async (data: { conversationId: string; message: string }) => {
          try {
            const { conversationId, message } = data;

            // Kiểm tra quyền truy cập
            const conversation =
              await this.conversationService.getConversationById(
                conversationId,
              );

            if (!conversation) {
              socket.emit('error', { message: 'Conversation not found' });
              return;
            }

            if (
              conversation.userId !== userId &&
              conversation.agentId !== userId &&
              socket.userRole !== 'admin'
            ) {
              socket.emit('error', { message: 'Unauthorized' });
              return;
            }

            // Lưu tin nhắn vào database
            const chatMessage = await this.chatMessageService.createMessage({
              conversationId,
              senderId: userId,
              content: message,
              messageType: MessageType.TEXT,
              isFromBot: false,
            });

            // Phát tin nhắn đến tất cả clients trong conversation room
            io.to(`conversation:${conversationId}`).emit('new_message', {
              id: chatMessage.id,
              content: chatMessage.content,
              senderId: chatMessage.senderId,
              isFromBot: chatMessage.isFromBot,
              createdAt: chatMessage.createdAt,
              conversationId,
            });

            // Nếu đang chat với bot, xử lý phản hồi từ bot
            if (conversation.conversationType === ConversationType.BOT) {
              // Gửi typing indicator
              io.to(`conversation:${conversationId}`).emit('typing', {
                conversationId,
                isTyping: true,
              });

              try {
                // Gọi chatbot service
                const botResponse = await this.chatbotService.chat({
                  message,
                  userId: conversation.userId,
                  sessionId: conversationId,
                });

                // Lưu phản hồi bot vào database
                const botMessage = await this.chatMessageService.createMessage({
                  conversationId,
                  senderId: null,
                  content: botResponse.message,
                  messageType: MessageType.TEXT,
                  isFromBot: true,
                  metadata: {
                    products: botResponse.products,
                    requiresAction: botResponse.requiresAction,
                  },
                });

                // Gửi phản hồi bot
                io.to(`conversation:${conversationId}`).emit('new_message', {
                  id: botMessage.id,
                  content: botMessage.content,
                  senderId: botMessage.senderId,
                  isFromBot: botMessage.isFromBot,
                  createdAt: botMessage.createdAt,
                  conversationId,
                  metadata: botMessage.metadata,
                });
              } catch (error) {
                logger.error('Error processing bot response:', error);
                socket.emit('error', {
                  message: 'Failed to get bot response',
                });
              } finally {
                // Tắt typing indicator
                io.to(`conversation:${conversationId}`).emit('typing', {
                  conversationId,
                  isTyping: false,
                });
              }
            }

            logger.info(`Message sent in conversation ${conversationId}`);
          } catch (error) {
            logger.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
          }
        },
      );

      // Xử lý chuyển đổi sang nhân viên
      socket.on('switch_to_human', async (data: { conversationId: string }) => {
        try {
          const { conversationId } = data;

          const conversation =
            await this.conversationService.getConversationById(conversationId);

          if (!conversation || conversation.userId !== userId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          // Chuyển đổi sang human
          const updatedConversation =
            await this.conversationService.switchToHuman(conversationId);

          // Tạo system message
          await this.chatMessageService.createMessage({
            conversationId,
            senderId: null,
            content:
              'Đã chuyển sang chế độ chat với nhân viên. Vui lòng đợi nhân viên phản hồi.',
            messageType: MessageType.SYSTEM,
            isFromBot: false,
          });

          // Thông báo cho tất cả clients trong conversation
          io.to(`conversation:${conversationId}`).emit('conversation_updated', {
            conversationId,
            conversationType: updatedConversation.conversationType,
            status: updatedConversation.status,
          });

          // Thông báo cho tất cả nhân viên (admin) về conversation mới
          io.to('admin').emit('new_waiting_conversation', {
            conversationId: updatedConversation.id,
            userId: updatedConversation.userId,
            createdAt: updatedConversation.createdAt,
          });

          logger.info(`Conversation ${conversationId} switched to human`);
        } catch (error) {
          logger.error('Error switching to human:', error);
          socket.emit('error', { message: 'Failed to switch to human' });
        }
      });

      // Xử lý chuyển đổi về bot
      socket.on('switch_to_bot', async (data: { conversationId: string }) => {
        try {
          const { conversationId } = data;

          const conversation =
            await this.conversationService.getConversationById(conversationId);

          if (!conversation) {
            socket.emit('error', { message: 'Conversation not found' });
            return;
          }

          // Chỉ user hoặc admin mới có thể chuyển về bot
          if (conversation.userId !== userId && socket.userRole !== 'admin') {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          const updatedConversation =
            await this.conversationService.switchToBot(conversationId);

          // Tạo system message
          await this.chatMessageService.createMessage({
            conversationId,
            senderId: null,
            content: 'Đã chuyển về chế độ chat với chatbot.',
            messageType: MessageType.SYSTEM,
            isFromBot: false,
          });

          io.to(`conversation:${conversationId}`).emit('conversation_updated', {
            conversationId,
            conversationType: updatedConversation.conversationType,
            status: updatedConversation.status,
          });

          logger.info(`Conversation ${conversationId} switched to bot`);
        } catch (error) {
          logger.error('Error switching to bot:', error);
          socket.emit('error', { message: 'Failed to switch to bot' });
        }
      });

      // Xử lý đánh dấu đã đọc
      socket.on('mark_as_read', async (data: { conversationId: string }) => {
        try {
          const { conversationId } = data;
          await this.chatMessageService.markAsRead(conversationId, userId);
          socket.emit('marked_as_read', { conversationId });
        } catch (error) {
          logger.error('Error marking as read:', error);
        }
      });

      // Xử lý ngắt kết nối
      socket.on('disconnect', () => {
        logger.info(
          `WebSocket client disconnected: ${socket.id}, userId: ${userId}`,
        );

        // Xóa mapping
        this.userSockets.delete(userId);

        // Xóa khỏi conversation rooms
        this.conversationRooms.forEach((sockets, conversationId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.conversationRooms.delete(conversationId);
          }
        });
      });
    });

    // Nếu user là admin, join admin room
    io.on('connection', (socket: AuthenticatedSocket) => {
      if (socket.userRole === 'admin') {
        socket.join('admin');
        logger.info(`Admin ${socket.userId} connected`);
      }
    });
  }
}
