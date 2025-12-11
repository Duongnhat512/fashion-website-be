# Gemini API Key Rotation

Hệ thống xoay vòng API keys cho Gemini để xử lý rate limit (20 requests/ngày cho free tier).

## Cấu Hình

Thêm vào file `.env`:

```env
# Option 1: Multiple keys (khuyến nghị)
GEMINI_API_KEYS=key1,key2,key3

# Option 2: Single key (backward compatible)
GEMINI_API_KEY=your_single_key
```

**Lưu ý:** Nếu có `GEMINI_API_KEYS`, hệ thống sẽ ưu tiên sử dụng nó. Nếu không, sẽ fallback về `GEMINI_API_KEY`.

## Cách Hoạt Động

### 1. Key Manager Service
- Quản lý nhiều API keys
- Track usage count cho mỗi key (lưu trong Redis với TTL 24h)
- Tự động reset counter mỗi ngày
- Round-robin strategy: chọn key có usage thấp nhất

### 2. Automatic Rotation
- Khi một key bị rate limit (429) hoặc lỗi, hệ thống tự động thử key tiếp theo
- Retry tối đa 3 lần với các keys khác nhau
- Tự động đánh dấu key đã sử dụng để track quota

### 3. Usage Tracking
- Mỗi key được track riêng trong Redis
- Format: `gemini:key:usage:key_1` (counter), `gemini:key:info:key_1` (metadata)
- TTL: 24 giờ (tự động reset mỗi ngày)
- Daily limit: 20 requests/key (có thể config trong code)

## API Endpoints (Nếu cần monitoring)

Bạn có thể thêm endpoints để monitor key usage:

```typescript
// Example: Add to a controller
import { GeminiKeyManager } from '../services/gemini_key_manager/implements/gemini_key_manager.service.implement';
import { config } from '../config/env';

const keyManager = new GeminiKeyManager(config.gemini.apiKeys);

// Get keys status
const status = await keyManager.getKeysStatus();
// Returns: [{ key: string, id: string, dailyUsage: number, lastResetDate: string, isActive: boolean }]

// Get total remaining requests
const remaining = await keyManager.getTotalRemainingRequests();
// Returns: number
```

## Tính Năng

- ✅ Tự động xoay vòng giữa nhiều keys
- ✅ Track usage per key
- ✅ Tự động reset mỗi ngày
- ✅ Retry với key khác khi gặp rate limit
- ✅ Fallback embedding khi tất cả keys hết quota
- ✅ Logging chi tiết cho debugging

## Lưu Ý

1. **Rate Limit:** Gemini free tier có giới hạn 20 requests/ngày. Với 3 keys, bạn có thể xử lý tối đa 60 requests/ngày.

2. **Redis Required:** Key manager sử dụng Redis để track usage. Đảm bảo Redis đang chạy.

3. **Key Format:** Keys được phân tách bằng dấu phẩy trong `GEMINI_API_KEYS`. Không có khoảng trắng thừa.

4. **Backward Compatible:** Hệ thống vẫn hỗ trợ `GEMINI_API_KEY` (single key) nếu không có `GEMINI_API_KEYS`.

## Troubleshooting

### Tất cả keys đều hết quota
- Hệ thống sẽ trả về thông báo lỗi thân thiện
- Embedding service sẽ fallback về simple embedding
- Chatbot sẽ trả về message "Xin lỗi, hệ thống đang quá tải"

### Key không được reset
- Kiểm tra Redis connection
- Kiểm tra TTL của keys trong Redis
- Reset thủ công: `await keyManager.resetKeyUsage('key_1')`

### Logs
Xem logs để theo dõi:
- Key nào đang được sử dụng
- Usage count của mỗi key
- Khi nào key bị rate limit

