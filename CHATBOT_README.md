# Chatbot Hướng Dẫn Sử Dụng

## Tổng Quan

Chatbot đã được tích hợp vào hệ thống với các tính năng:

- **RAG (Retrieval-Augmented Generation)**: Tìm kiếm sản phẩm dựa trên semantic search
- **Function Calling**: Tự động gọi các function để tìm sản phẩm, thêm vào giỏ hàng, tạo đơn hàng
- **Conversational Memory**: Lưu lịch sử hội thoại trong Redis
- **Vector Embeddings**: Sử dụng embeddings để tìm kiếm sản phẩm tương đồng

## Cài Đặt

### 1. Cấu hình Environment Variables

Thêm vào file `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Chạy Migration

Chạy migration để thêm cột `embedding` vào bảng `products`:

```bash
# Chạy migration script
ts-node app/migrations/add_product_embedding.ts
```

Hoặc chạy trực tiếp SQL:

```sql
ALTER TABLE products
ADD COLUMN IF NOT EXISTS embedding JSONB;

CREATE INDEX IF NOT EXISTS idx_products_embedding
ON products USING GIN (embedding);
```

### 3. Khởi động ứng dụng

```bash
npm run dev
```

Embedding scheduler sẽ tự động chạy khi app khởi động để tạo embeddings cho các sản phẩm hiện có.

## API Endpoints

### 1. Chat với Chatbot

**POST** `/api/v1/chatbot/chat`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "message": "Tôi muốn tìm áo sơ mi trắng",
  "sessionId": "optional_session_id" // Mặc định dùng userId
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Tôi tìm thấy một số áo sơ mi trắng cho bạn...",
    "products": [
      {
        "id": "PRO-...",
        "name": "Áo sơ mi trắng",
        "shortDescription": "...",
        "variants": [...]
      }
    ],
    "requiresAction": null // hoặc "add_to_cart" hoặc "create_order"
  }
}
```

### 2. Xóa lịch sử hội thoại

**POST** `/api/v1/chatbot/clear`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "sessionId": "optional_session_id"
}
```

## Tính Năng Chatbot

### 1. Tìm kiếm sản phẩm

Chatbot có thể tìm kiếm sản phẩm dựa trên:

- Tên sản phẩm
- Mô tả
- Danh mục
- Màu sắc, phong cách

**Ví dụ:**

- "Tôi muốn tìm áo sơ mi trắng"
- "Có quần jean nào không?"
- "Cho tôi xem các sản phẩm thời trang nam"

### 2. Thêm vào giỏ hàng

Chatbot có thể tự động thêm sản phẩm vào giỏ hàng khi người dùng yêu cầu.

**Ví dụ:**

- "Thêm sản phẩm này vào giỏ hàng"
- "Tôi muốn mua áo này"

### 3. Tạo đơn hàng

Chatbot có thể tạo đơn hàng từ giỏ hàng khi người dùng cung cấp đầy đủ thông tin địa chỉ.

**Ví dụ:**

- "Tôi muốn đặt hàng"
- "Thanh toán giúp tôi"

Chatbot sẽ hỏi thông tin:

- Tên người nhận
- Số điện thoại
- Địa chỉ đầy đủ (số nhà, đường, phường/xã, quận/huyện, thành phố/tỉnh)
- Phương thức thanh toán (COD hoặc online)

## Cải Thiện Embedding Service (Tùy chọn)

Hiện tại, embedding service sử dụng hash-based fallback. Để sử dụng Google Embedding API thực sự:

1. **Cài đặt axios:**

```bash
npm install axios
```

2. **Cập nhật `app/services/embedding/implements/embedding.service.implement.ts`:**

Thay thế method `generateEmbedding` bằng:

```typescript
async generateEmbedding(text: string): Promise<number[]> {
  try {
    const axios = require('axios');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${config.gemini.apiKey}`,
      {
        content: {
          parts: [{ text }]
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.embedding.values;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    // Fallback to simple embedding
    return this.createSimpleEmbedding(text);
  }
}
```

**Lưu ý:** Cần enable Generative Language API trong Google Cloud Console.

## Cấu Trúc Code

```
app/
├── services/
│   ├── chatbot/
│   │   ├── chatbot.service.interface.ts
│   │   └── implements/
│   │       ├── chatbot.service.implement.ts
│   │       └── conversation_memory.service.implement.ts
│   └── embedding/
│       ├── embedding.service.interface.ts
│       └── implements/
│           └── embedding.service.implement.ts
├── controllers/
│   └── chatbot.controller.ts
├── routers/
│   └── chatbot.route.ts
└── schedulers/
    └── embedding.scheduler.ts
```

## Lưu Ý

1. **Embedding Generation**: Embeddings được tạo tự động khi:

   - Tạo sản phẩm mới
   - Cập nhật sản phẩm
   - Chạy scheduler khi app khởi động

2. **Conversation Memory**: Lịch sử hội thoại được lưu trong Redis với TTL 24 giờ.

3. **Rate Limiting**: Chatbot endpoint sử dụng rate limiting mặc định của app.

4. **Security**: Tất cả endpoints yêu cầu authentication (JWT token).

## Troubleshooting

### Lỗi "GEMINI_API_KEY is required"

- Kiểm tra file `.env` có chứa `GEMINI_API_KEY`
- Đảm bảo API key hợp lệ

### Embeddings không được tạo

- Kiểm tra logs để xem lỗi cụ thể
- Chạy thủ công: `ts-node app/schedulers/embedding.scheduler.ts`

### Chatbot không tìm thấy sản phẩm

- Đảm bảo sản phẩm đã có embedding
- Kiểm tra Redis search index đã được khởi tạo
- Thử tìm kiếm với từ khóa cụ thể hơn

## Tương Lai

Các cải tiến có thể thêm:

- [ ] Sử dụng Google Embedding API thực sự
- [ ] Tích hợp với pgvector cho semantic search tốt hơn
- [ ] Thêm analytics cho chatbot interactions
- [ ] Multi-language support
- [ ] Voice interface
