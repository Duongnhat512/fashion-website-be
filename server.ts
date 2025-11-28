import app from './app/app';
import { config } from './app/config/env';
import { createServer } from 'http';
import { WebSocketService } from './app/services/websocket/implements/websocket.service.implement';
import logger from './app/utils/logger';

const httpServer = createServer(app);
const webSocketService = new WebSocketService();
const io = webSocketService.initialize(httpServer);

// Export io để sử dụng ở các nơi khác
export { io };

httpServer.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
  logger.info(`WebSocket server initialized`);
});
