import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface IWebSocketService {
  /**
   * Khởi tạo WebSocket server
   */
  initialize(server: HTTPServer): SocketIOServer;

  /**
   * Xử lý kết nối WebSocket mới
   */
  handleConnection(io: SocketIOServer): void;
}

