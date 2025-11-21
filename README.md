# Fashion Website Backend

Hệ thống backend thương mại điện tử thời trang hiện đại, được xây dựng trên nền tảng **Node.js**, **Express** và **TypeScript**. Hệ thống tích hợp mạnh mẽ các công nghệ AI (Chatbot, Recommendation) và tìm kiếm hiệu năng cao (Redis Search).

## 🚀 Tính Năng Nổi Bật

### 1. Quản lý & Thương mại
- **Xác thực & Phân quyền**: JWT (Access/Refresh Token), Rate Limiting đa tầng, bảo mật Helmet.
- **Sản phẩm & Kho**: Quản lý đa biến thể (Size/Color), tồn kho (Inventory), nhập kho (Stock Entry), nhiều kho hàng (Multi-warehouse).
- **Đơn hàng & Thanh toán**: Quy trình đặt hàng trọn vẹn, tích hợp cổng thanh toán **VNPay**, quản lý giỏ hàng.
- **Tiếp thị (Marketing)**: Quản lý khuyến mãi (Promotions), lập lịch tự động kích hoạt chiến dịch.

### 2. AI & Chatbot Thông Minh
- **AI Chatbot**: Trợ lý ảo tích hợp Google Gemini, hỗ trợ tìm kiếm sản phẩm theo ngữ nghĩa (Semantic Search), thêm vào giỏ hàng và tạo đơn hàng qua hội thoại.
- **Gợi ý sản phẩm (Recommendation)**: Hệ thống gợi ý dựa trên Vector Embeddings và hành vi người dùng.
- **Redis Search**: Tìm kiếm Full-text và Vector tốc độ cao.

### 3. Vận hành & Giám sát
- **Logging**: Hệ thống log chuẩn hóa (Winston + Morgan).
- **Scheduling**: Cron jobs tự động cập nhật Embeddings và trạng thái Khuyến mãi.
- **Upload**: Tích hợp Cloudinary xử lý hình ảnh.

## 🛠 Công Nghệ Sử Dụng

- **Core**: Node.js (v18+), TypeScript, Express.
- **Database**: PostgreSQL (Lưu trữ chính), Redis Stack (Cache, Queue, Vector Search).
- **ORM**: TypeORM.
- **AI/ML**: Google Gemini API (`@google/generative-ai`), Vector Embeddings.
- **Third-party**: Cloudinary (Media), VNPay (Payment), Nodemailer (Email).

## 📋 Yêu Cầu Môi Trường

- **Node.js**: v18 trở lên.
- **Docker & Docker Compose**: Để chạy PostgreSQL và Redis Stack.
- **Tài khoản dịch vụ**:
  - Google Gemini API Key.
  - Cloudinary Cloud Name & Keys.
  - Gmail (App Password) cho SMTP.
  - VNPay Sandbox (nếu test thanh toán).

## ⚙️ Cài Đặt & Chạy Dự Án

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Khởi động hạ tầng (DB & Redis)
Sử dụng Docker Compose để chạy PostgreSQL và Redis Stack (bao gồm RedisSearch & RedisJSON).
```bash
docker-compose up -d
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu (nếu có) hoặc sử dụng cấu hình sau:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=postgres
PG_DATABASE=fashion_db

# Redis (Redis Stack)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=... (nếu có cấu hình trong docker-compose)

# Security
SECRET_TOKEN=your_super_secret_jwt_key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
SALT_ROUNDS=10

# Google Gemini (Quan trọng cho Chatbot/Search)
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email
GOOGLE_SENDER=your_email@gmail.com
GOOGLE_PASSWORD=your_app_password
```

### Bước 4: Chuẩn bị Cơ sở dữ liệu
Chạy migration để tạo bảng và đặc biệt là cột `embedding` cho tính năng AI:

```bash
# Đồng bộ schema cơ bản (lưu ý: production nên dùng migration)
npm run dev 
# (Lần chạy đầu TypeORM có thể tự sync nếu synchronize: true trong config)

# HOẶC chạy script migration riêng cho embedding (nếu cần)
ts-node app/migrations/add_product_embedding.ts
```

### Bước 5: Khởi chạy ứng dụng

**Chế độ phát triển (Development):**
```bash
npm run dev
```
*Server sẽ chạy tại `http://localhost:3000`. API prefix: `/api/v1`*

**Chế độ Production:**
```bash
npm run build
npm start
```

## 📚 Tài Liệu API

- **Base URL**: `/api/v1`
- **Health Check**: `GET /health`
- **Modules**:
  - `/auth`: Đăng ký, đăng nhập, refresh token.
  - `/products`: CRUD sản phẩm, tìm kiếm.
  - `/chatbot`: Chat, xóa lịch sử hội thoại.
  - `/orders`: Tạo đơn, xem lịch sử.
  - ... (Xem chi tiết trong thư mục `app/routers`)

## 🧩 Cấu Trúc Thư Mục

```
app/
├── config/         # Cấu hình (DB, Redis, Env)
├── controllers/    # Xử lý request/response
├── dtos/           # Data Transfer Objects
├── middlewares/    # Auth, Validation, Security
├── models/         # TypeORM Entities
├── routers/        # Định tuyến API
├── services/       # Business Logic (Product, Chatbot, Order...)
├── schedulers/     # Cron jobs
├── utils/          # Các hàm tiện ích
└── app.ts          # Entry point
```

## 📝 Ghi Chú
- Để Chatbot hoạt động tốt, sản phẩm cần có `embedding`. Hệ thống có Scheduler tự động tạo embedding cho sản phẩm mới.
- Xem thêm chi tiết về Chatbot tại file `CHATBOT_README.md`.
