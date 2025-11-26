# Hướng Dẫn Chat Realtime với Nhân Viên

## Tổng Quan

Hệ thống đã được nâng cấp để hỗ trợ:
- **Chat realtime** qua WebSocket
- **Lưu trữ lịch sử chat vĩnh viễn** trong database
- **Chuyển đổi qua lại** giữa chatbot và chat với nhân viên
- **Quản lý conversations** với các trạng thái khác nhau

## Cài Đặt

### 1. Cài đặt dependencies

```bash
npm install
```

Package mới được thêm:
- `socket.io`: WebSocket server
- `@types/socket.io`: Type definitions

### 2. Database Migration

TypeORM sẽ tự động tạo các bảng mới khi khởi động:
- `conversations`: Lưu thông tin conversations
- `chat_messages`: Lưu các tin nhắn

### 3. Cấu hình Environment Variables

Đảm bảo các biến môi trường sau đã được cấu hình:

```env
# Cấu hình hiện có
DATABASE_URL=...
REDIS_URL=...
GEMINI_API_KEY=...

# Thêm biến mới (nếu cần)
FRONTEND_URL=http://localhost:3000  # URL frontend để CORS
```

## Kiến Trúc

### Database Models

#### 1. Conversation Model
- `id`: UUID
- `userId`: User tạo conversation
- `agentId`: Nhân viên đang xử lý (null nếu đang chat với bot)
- `conversationType`: `bot` hoặc `human`
- `status`: `active`, `waiting`, `resolved`, `closed`
- `title`: Tiêu đề conversation
- `lastMessage`: Tin nhắn cuối cùng (preview)

#### 2. ChatMessage Model
- `id`: UUID
- `conversationId`: ID conversation
- `senderId`: User gửi tin nhắn (null nếu là bot)
- `messageType`: `text`, `image`, `system`
- `content`: Nội dung tin nhắn
- `isFromBot`: Boolean
- `isRead`: Đã đọc chưa
- `metadata`: JSON metadata (products, actions, etc.)

### Services

#### 1. ConversationService
Quản lý conversations:
- Tạo/lấy active conversation
- Chuyển đổi giữa bot và human
- Assign nhân viên
- Quản lý trạng thái

#### 2. ChatMessageService
Quản lý tin nhắn:
- Lưu tin nhắn vào database
- Lấy lịch sử tin nhắn
- Đánh dấu đã đọc
- Đếm tin nhắn chưa đọc

#### 3. WebSocketService
Xử lý realtime chat:
- Authentication qua JWT
- Join/leave conversation rooms
- Gửi/nhận tin nhắn realtime
- Typing indicators
- Chuyển đổi conversation type

## API Endpoints

### Conversation Endpoints

#### 1. Lấy hoặc tạo active conversation
```
GET /api/v1/conversations/active
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "conv-uuid",
    "userId": "user-uuid",
    "conversationType": "bot",
    "status": "active",
    ...
  }
}
```

#### 2. Lấy tất cả conversations của user
```
GET /api/v1/conversations
Authorization: Bearer <token>
```

#### 3. Lấy conversation theo ID
```
GET /api/v1/conversations/:id
Authorization: Bearer <token>
```

#### 4. Lấy messages của conversation
```
GET /api/v1/conversations/:id/messages?limit=50
Authorization: Bearer <token>
```

#### 5. Chuyển đổi sang chat với nhân viên
```
POST /api/v1/conversations/:id/switch-to-human
Authorization: Bearer <token>
```

#### 6. Chuyển đổi về chat với bot
```
POST /api/v1/conversations/:id/switch-to-bot
Authorization: Bearer <token>
```

#### 7. Assign nhân viên (Admin only)
```
POST /api/v1/conversations/:id/assign-agent
Authorization: Bearer <admin-token>
Body: { "agentId": "agent-uuid" }
```

#### 8. Lấy conversations đang chờ (Admin only)
```
GET /api/v1/conversations/waiting
Authorization: Bearer <admin-token>
```

#### 9. Lấy conversations của nhân viên (Admin only)
```
GET /api/v1/conversations/agent/my-conversations
Authorization: Bearer <admin-token>
```

### Chatbot Endpoints (Updated)

#### Chat với chatbot
```
POST /api/v1/chatbot/chat
Authorization: Bearer <token>
Body: {
  "message": "Tôi muốn tìm áo sơ mi",
  "conversationId": "optional-conversation-uuid"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "Tôi tìm thấy...",
    "products": [...],
    "conversationId": "conv-uuid",
    ...
  }
}
```

## WebSocket Events

### Client → Server

#### 1. Join Conversation
```javascript
socket.emit('join_conversation', {
  conversationId: 'conv-uuid'
});
```

#### 2. Send Message
```javascript
socket.emit('send_message', {
  conversationId: 'conv-uuid',
  message: 'Hello!'
});
```

#### 3. Switch to Human
```javascript
socket.emit('switch_to_human', {
  conversationId: 'conv-uuid'
});
```

#### 4. Switch to Bot
```javascript
socket.emit('switch_to_bot', {
  conversationId: 'conv-uuid'
});
```

#### 5. Mark as Read
```javascript
socket.emit('mark_as_read', {
  conversationId: 'conv-uuid'
});
```

### Server → Client

#### 1. Conversation History
```javascript
socket.on('conversation_history', (data) => {
  // data.conversationId
  // data.messages: Array<Message>
});
```

#### 2. New Message
```javascript
socket.on('new_message', (message) => {
  // message.id
  // message.content
  // message.senderId
  // message.isFromBot
  // message.createdAt
  // message.conversationId
  // message.metadata (optional)
});
```

#### 3. Typing Indicator
```javascript
socket.on('typing', (data) => {
  // data.conversationId
  // data.isTyping: boolean
});
```

#### 4. Conversation Updated
```javascript
socket.on('conversation_updated', (data) => {
  // data.conversationId
  // data.conversationType: 'bot' | 'human'
  // data.status: 'active' | 'waiting' | ...
});
```

#### 5. New Waiting Conversation (Admin only)
```javascript
socket.on('new_waiting_conversation', (data) => {
  // data.conversationId
  // data.userId
  // data.createdAt
});
```

#### 6. Error
```javascript
socket.on('error', (error) => {
  // error.message
});
```

## Ví Dụ Sử Dụng

### 1. Frontend: Kết nối WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join conversation
socket.emit('join_conversation', { 
  conversationId: 'conv-uuid' 
});

// Lắng nghe tin nhắn mới
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // Cập nhật UI
});

// Gửi tin nhắn
socket.emit('send_message', {
  conversationId: 'conv-uuid',
  message: 'Hello!'
});
```

### 2. Chuyển đổi từ Bot sang Human

```javascript
// User yêu cầu chat với nhân viên
socket.emit('switch_to_human', {
  conversationId: 'conv-uuid'
});

// Lắng nghe cập nhật
socket.on('conversation_updated', (data) => {
  if (data.conversationType === 'human') {
    // Hiển thị thông báo "Đang chờ nhân viên phản hồi"
  }
});
```

### 3. Admin: Xử lý conversations đang chờ

```javascript
// Admin lắng nghe conversations mới
socket.on('new_waiting_conversation', (data) => {
  // Hiển thị notification
  // Có thể assign agent
});

// Admin assign agent
fetch('/api/v1/conversations/:id/assign-agent', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentId: 'agent-uuid'
  })
});
```

## Luồng Hoạt Động

### Chat với Bot
1. User gửi tin nhắn → Lưu vào database
2. Bot xử lý → Gửi phản hồi → Lưu vào database
3. Phát tin nhắn qua WebSocket cho tất cả clients trong room

### Chuyển sang Human
1. User yêu cầu "Chat với nhân viên"
2. System chuyển conversation type sang `human`
3. Status chuyển sang `waiting` nếu chưa có agent
4. Gửi notification cho admin
5. Admin assign agent → Status chuyển sang `active`

### Chat với Human
1. User gửi tin nhắn → Lưu vào database
2. Phát tin nhắn cho agent
3. Agent phản hồi → Lưu vào database → Phát cho user

### Chuyển về Bot
1. User hoặc Admin yêu cầu "Chuyển về bot"
2. System chuyển conversation type sang `bot`
3. Unassign agent
4. Tiếp tục chat với bot

## Lưu Ý

1. **Authentication**: WebSocket yêu cầu JWT token trong `auth.token` hoặc query string
2. **Authorization**: Kiểm tra quyền truy cập conversation trước khi join
3. **Redis vs Database**: 
   - Redis: Dùng cho ConversationMemoryService (temporary cache)
   - Database: Lưu vĩnh viễn conversations và messages
4. **Room Management**: Mỗi conversation có một room riêng để phát tin nhắn
5. **Error Handling**: Luôn xử lý lỗi và gửi phản hồi phù hợp cho client

## Troubleshooting

### WebSocket không kết nối được
- Kiểm tra token authentication
- Kiểm tra CORS configuration
- Kiểm tra firewall/network

### Tin nhắn không được lưu
- Kiểm tra database connection
- Kiểm tra permissions
- Xem logs để debug

### Bot không phản hồi
- Kiểm tra GEMINI_API_KEY
- Kiểm tra Redis connection (cho memory service)
- Xem logs để debug

