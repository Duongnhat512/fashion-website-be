# 🛍️ Fashion Website Backend

> Hệ thống backend thương mại điện tử thời trang hiện đại với AI Chatbot thông minh, Chat Realtime, và quản lý đa kho hàng

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis_Stack-6.2-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)

---

## 📖 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Yêu Cầu Môi Trường](#-yêu-cầu-môi-trường)
- [Cài Đặt & Chạy](#️-cài-đặt--chạy)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [API Documentation](#-api-documentation)
- [Bảo Mật](#-bảo-mật)
- [Database Schema](#-database-schema)
- [Scheduled Tasks](#-scheduled-tasks)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Giới Thiệu

**Fashion Website Backend** là một hệ thống backend thương mại điện tử **production-ready** được thiết kế đặc biệt cho ngành thời trang. Hệ thống được xây dựng trên nền tảng **Node.js**, **TypeScript**, và **Express**, tích hợp sâu các công nghệ AI tiên tiến từ Google Gemini để tạo ra trải nghiệm mua sắm thông minh và hiện đại.

### 🌟 Điểm Khác Biệt

- **AI-Powered**: Chatbot thông minh với khả năng hiểu ngữ nghĩa, tự động thực hiện hành động
- **Real-time**: Chat trực tiếp với nhân viên qua WebSocket
- **Scalable**: Hỗ trợ đa kho hàng, vector search, Redis caching
- **Secure**: Nhiều lớp bảo mật, rate limiting, input sanitization
- **Modern**: TypeScript, async/await, decorators, dependency injection

---

## 🚀 Tính Năng Nổi Bật

### 1. 🤖 AI Chatbot Thông Minh

Tích hợp **Google Gemini** với khả năng Function Calling và RAG (Retrieval-Augmented Generation):

- ✅ **Semantic Search**: Tìm kiếm sản phẩm theo ngữ nghĩa tự nhiên
- ✅ **Vector Embeddings**: Tìm sản phẩm tương đồng bằng cosine similarity
- ✅ **Function Calling**: Tự động thêm vào giỏ hàng, tạo đơn hàng
- ✅ **Conversational Memory**: Lưu lịch sử hội thoại trong Redis (TTL 24h)
- ✅ **Multilingual**: Hỗ trợ tiếng Việt tự nhiên

**Ví dụ sử dụng:**
```
User: "Tôi muốn tìm áo sơ mi trắng cho nam, giá dưới 500k"
Bot: [Tự động tìm kiếm và gợi ý sản phẩm phù hợp]
User: "Thêm sản phẩm đầu tiên vào giỏ hàng"
Bot: [Tự động gọi function addToCart]
```

📚 [Xem chi tiết tại CHATBOT_README.md](./CHATBOT_README.md)

### 2. 💬 Chat Realtime với Nhân Viên

Hệ thống chat trực tiếp qua **Socket.io** với đầy đủ tính năng:

- ✅ **WebSocket Connection**: Kết nối realtime giữa khách hàng và nhân viên
- ✅ **Bot ↔ Human Switch**: Chuyển đổi linh hoạt giữa bot và nhân viên
- ✅ **Typing Indicators**: Hiển thị trạng thái đang gõ
- ✅ **Persistent Storage**: Lưu lịch sử chat vĩnh viễn trong database
- ✅ **Conversation States**: ACTIVE, WAITING, RESOLVED, CLOSED
- ✅ **Agent Assignment**: Admin gán nhân viên cho conversation
- ✅ **Notifications**: Thông báo realtime cho agents

📚 [Xem chi tiết tại REALTIME_CHAT_README.md](./REALTIME_CHAT_README.md)

### 3. 📦 Quản Lý Kho Hàng Đa Địa Điểm

Hệ thống warehouse management hoàn chỉnh:

- ✅ **Multi-Warehouse**: Quản lý nhiều kho hàng khác nhau
- ✅ **Inventory Tracking**: Theo dõi tồn kho theo variant & warehouse
  - On-hand quantity (số lượng thực tế)
  - Reserved quantity (đã đặt nhưng chưa xuất)
- ✅ **Stock Entry**: Nhập/Xuất/Chuyển kho với workflow:
  - DRAFT → APPROVED → COMPLETED
- ✅ **Real-time Updates**: Cập nhật tồn kho realtime khi có order

### 4. 🎁 Hệ Thống Khuyến Mãi & Voucher

Marketing automation với scheduler tự động:

**Promotions:**
- Giảm giá theo % hoặc số tiền cố định
- Áp dụng cho sản phẩm hoặc category
- Lập lịch tự động: start_date → end_date
- Scheduler tự động kích hoạt/vô hiệu hóa
- Trạng thái: DRAFT, ACTIVE, EXPIRED

**Vouchers:**
- Mã giảm giá với code unique
- Discount percentage + max discount value
- Min order value requirement
- Usage limit (tổng số lần & per user)
- Stackable options
- Tracking usage history

### 5. 🛒 Quản Lý Sản Phẩm & Đơn Hàng

**Sản phẩm:**
- CRUD với slug tự động
- Quản lý biến thể (variants): Size, Color, SKU
- Mỗi variant có giá riêng, discount, hình ảnh
- Upload hình ảnh qua Cloudinary
- Tags & Categories (hierarchical)
- Rating & Reviews với auto-update average rating

**Tìm kiếm:**
- Full-text search qua Redis
- Semantic search qua Vector Embeddings
- Filter: category, price range, color, size
- Sort: newest, bestseller, price

**Đơn hàng:**
- Quy trình đầy đủ: UNPAID → PENDING → PROCESSING → SHIPPING → DELIVERED → COMPLETED
- Tích hợp voucher/promotion tự động
- Địa chỉ giao hàng linh hoạt
- Phương thức thanh toán: COD, Online (VNPay)
- Shipping fee calculation
- Order history & tracking

### 6. 💳 Thanh Toán Trực Tuyến

Tích hợp **VNPay** payment gateway:

- ✅ Tạo payment URL
- ✅ Xử lý callback từ VNPay
- ✅ Cập nhật trạng thái đơn hàng tự động
- ✅ Payment verification & security
- ✅ Support sandbox & production

### 7. 📊 AI Analytics & Forecasting

**Revenue Forecasting:**
- Dự báo doanh thu sử dụng AI
- Phân tích xu hướng theo thời gian
- Time-series forecasting

**Product Recommendations:**
- Gợi ý dựa trên Vector Embeddings
- Personalized recommendations
- Similar products

**Statistics & Reports:**
- Doanh thu theo thời gian (ngày/tuần/tháng/năm)
- Top sản phẩm bán chạy
- User analytics
- Order analytics
- Tax reports (export PDF với font Roboto)

### 8. ⭐ Đánh Giá & Review

- Rating 1-5 sao
- Comment chi tiết
- Tự động cập nhật rating trung bình
- Review moderation (admin)
- Filter reviews theo rating

### 9. 📧 Email & Notifications

- Gửi email qua Gmail SMTP (Nodemailer)
- Email templates với Handlebars
- OTP verification
- Order confirmations
- Promotional emails

### 10. 📤 Upload & Media Management

- Tích hợp **Cloudinary**
- Upload images, videos
- Automatic optimization
- CDN delivery
- Responsive images

---

## 🛠 Công Nghệ Sử Dụng

### Core Technologies

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| Node.js | v18+ | Runtime environment |
| TypeScript | 5.9.2 | Type-safe programming |
| Express.js | 4.21.2 | Web framework |
| TypeORM | 0.3.26 | ORM with decorators |

### Database & Caching

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| PostgreSQL | 14+ | Primary database |
| Redis Stack | 6.2.6 | Cache, Queue, Vector Search |
| - Redis Cache | port 6379 | Cache, conversation memory |
| - Redis Queue | port 6380 | Background jobs |

### AI & Machine Learning

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| Google Gemini API | 0.24.1 | AI Chatbot, Embeddings |
| Vector Embeddings | - | Semantic search & recommendations |

### Real-time Communication

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| Socket.io | 4.7.5 | WebSocket for real-time chat |

### Security

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcrypt | 5.1.1 | Password hashing (12 rounds) |
| helmet | 8.1.0 | Security headers |
| express-rate-limit | 8.1.0 | Rate limiting |
| express-slow-down | 3.0.0 | Speed limiting |
| class-validator | 0.14.2 | Input validation |
| class-sanitizer | 1.0.1 | Input sanitization |

### Third-party Integrations

| Service | Version | Mục đích |
|---------|---------|----------|
| Cloudinary | 2.8.0 | Media storage & CDN |
| VNPay | 2.4.4 | Payment gateway |
| Nodemailer | 7.0.6 | Email sending (SMTP) |

### File Processing

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| ExcelJS | 4.4.0 | Excel export |
| PDFKit | 0.17.2 | PDF generation (invoices) |
| csv-parser | 3.0.0 | CSV import |
| multer | 2.0.2 | File upload middleware |

### Utilities

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| Winston | 3.18.3 | Logging framework |
| Morgan | 1.10.0 | HTTP request logger |
| compression | 1.8.1 | Response compression |
| slugify | 1.6.6 | URL slug generation |
| uuid | 11.1.0 | UUID generation |

---

## 🏗 Kiến Trúc Hệ Thống

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  (Web App, Mobile App, Third-party Services)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Middleware Layer                         │
│  Authentication │ Validation │ Security │ Rate Limiting  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Controller Layer                         │
│  Request Handling │ Response Formatting │ Error Handling │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                           │
│  Business Logic │ AI Integration │ Payment Processing   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Repository  │ │  Redis Cache │ │  Third-party │
│    Layer     │ │  Vector DB   │ │   Services   │
└──────┬───────┘ └──────────────┘ └──────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│   Database   │
└──────────────┘
```

### Data Flow

1. **Request** → Middleware (Auth, Validation, Security)
2. **Middleware** → Controller (Route handling)
3. **Controller** → Service (Business logic)
4. **Service** → Repository/Redis/Third-party
5. **Response** ← Controller ← Service ← Data Layer

### Key Design Patterns

- **Repository Pattern**: Tách biệt logic database access
- **Service Pattern**: Encapsulate business logic
- **Dependency Injection**: Loose coupling giữa các modules
- **DTO Pattern**: Validation và transformation data
- **Middleware Pattern**: Cross-cutting concerns (auth, logging)

---

## 📋 Yêu Cầu Môi Trường

### Software Requirements

- **Node.js**: v18.0.0 hoặc cao hơn
- **npm**: v8.0.0 hoặc cao hơn
- **Docker**: v20.10.0+ (để chạy PostgreSQL & Redis)
- **Docker Compose**: v2.0.0+

### Service Accounts (Required)

| Service | Requirement | Purpose |
|---------|-------------|---------|
| **Google Gemini API** | API Key | AI Chatbot, Embeddings, Forecasting |
| **Cloudinary** | Cloud Name, API Key, Secret | Media storage & CDN |
| **Gmail** | Email, App Password | SMTP email sending |
| **VNPay** | TMN Code, Secret Key | Payment gateway (optional for dev) |

### Hardware Recommendations

**Development:**
- CPU: 2+ cores
- RAM: 4GB+
- Storage: 10GB+

**Production:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ (depends on media storage)
- Network: Stable internet connection

---

## ⚙️ Cài Đặt & Chạy

### Bước 1: Clone Repository

```bash
git clone https://github.com/your-username/fashion-website-be.git
cd fashion-website-be
```

### Bước 2: Cài Đặt Dependencies

```bash
npm install
```

### Bước 3: Khởi Động Database & Redis

Sử dụng Docker Compose để chạy PostgreSQL và Redis Stack:

```bash
docker-compose up -d
```

Kiểm tra containers đang chạy:
```bash
docker ps
```

Bạn sẽ thấy:
- PostgreSQL: `localhost:5432`
- Redis Cache: `localhost:6379`
- Redis Queue: `localhost:6380` (nếu có cấu hình)

### Bước 4: Cấu Hình Environment Variables

Tạo file `.env` ở thư mục root:

```env
# ========================================
# SERVER CONFIGURATION
# ========================================
PORT=3000
NODE_ENV=development

# ========================================
# DATABASE (PostgreSQL)
# ========================================
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=postgres
PG_DATABASE=fashion_db

# ========================================
# REDIS (Redis Stack)
# ========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# ========================================
# SECURITY & JWT
# ========================================
SECRET_TOKEN=your_super_secret_jwt_key_change_this_in_production
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
SALT_ROUNDS=12

# ========================================
# GOOGLE GEMINI (AI Features)
# ========================================
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# ========================================
# CLOUDINARY (Media Storage)
# ========================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ========================================
# EMAIL (Gmail SMTP)
# ========================================
GOOGLE_SENDER=your_email@gmail.com
GOOGLE_PASSWORD=your_gmail_app_password

# ========================================
# VNPAY (Payment Gateway)
# ========================================
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_SECRET_KEY=your_vnpay_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_VERSION=2.1.0
VNPAY_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# ========================================
# CORS & SECURITY
# ========================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Bước 5: Chuẩn Bị Database

TypeORM sẽ tự động đồng bộ schema khi chạy lần đầu (nếu `synchronize: true`).

Nếu cần chạy migration thủ công cho product embeddings:

```bash
npx ts-node app/migrations/add_product_embedding.ts
```

### Bước 6: Khởi Chạy Ứng Dụng

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

Server sẽ chạy tại: **http://localhost:3000**

### Bước 7: Kiểm Tra Health Check

```bash
curl http://localhost:3000/health
```

Kết quả mong đợi:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📁 Cấu Trúc Dự Án

```
fashion-website-be/
│
├── app/                              # Source code chính
│   │
│   ├── config/                       # Cấu hình hệ thống
│   │   ├── data_source.ts            # TypeORM DataSource
│   │   ├── env.ts                    # Environment validation
│   │   ├── pg.config.ts              # PostgreSQL config
│   │   ├── redis.config.ts           # Redis config
│   │   └── security.config.ts        # Security settings
│   │
│   ├── models/                       # TypeORM Entities (26 models)
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── variant.model.ts
│   │   ├── category.model.ts
│   │   ├── order.model.ts
│   │   ├── order_item.model.ts
│   │   ├── cart.model.ts
│   │   ├── cart_item.model.ts
│   │   ├── warehouse.model.ts
│   │   ├── inventory.model.ts
│   │   ├── stock_entry.model.ts
│   │   ├── promotion.model.ts
│   │   ├── voucher.model.ts
│   │   ├── voucher_usage.model.ts
│   │   ├── review.model.ts
│   │   ├── conversation.model.ts
│   │   ├── chat_message.model.ts
│   │   ├── color.model.ts
│   │   ├── address.model.ts
│   │   └── enum/                     # Enums
│   │
│   ├── controllers/                  # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── product.controller.ts
│   │   ├── category.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── order.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── chatbot.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── warehouse.controller.ts
│   │   ├── stock_entry.controller.ts
│   │   ├── inventory.controller.ts
│   │   ├── promotion.controller.ts
│   │   ├── voucher.controller.ts
│   │   ├── review.controller.ts
│   │   ├── statistics.controller.ts
│   │   ├── tax_report.controller.ts
│   │   ├── upload.controller.ts
│   │   └── invoice.controller.ts
│   │
│   ├── services/                     # Business logic (30+ services)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── product/
│   │   ├── category/
│   │   ├── cart/
│   │   ├── order/
│   │   ├── payment/
│   │   ├── chatbot/
│   │   ├── conversation/
│   │   ├── chat_message/
│   │   ├── websocket/
│   │   ├── embedding/
│   │   ├── recommendation/
│   │   ├── revenue_forecast/
│   │   ├── redis_search/
│   │   ├── warehouse/
│   │   ├── stock_entry/
│   │   ├── inventory/
│   │   ├── promotion/
│   │   ├── voucher/
│   │   ├── review/
│   │   ├── statistics/
│   │   ├── tax_report/
│   │   ├── invoice/
│   │   ├── email/
│   │   ├── cloud/
│   │   ├── importer/
│   │   ├── otp/
│   │   └── color/
│   │
│   ├── routers/                      # API routes
│   │   ├── auth.route.ts
│   │   ├── user.router.ts
│   │   ├── product.route.ts
│   │   ├── category.route.ts
│   │   ├── cart.route.ts
│   │   ├── order.route.ts
│   │   ├── payment.route.ts
│   │   ├── chatbot.route.ts
│   │   ├── conversation.route.ts
│   │   ├── warehouse.route.ts
│   │   ├── stock_entry.route.ts
│   │   ├── inventory.route.ts
│   │   ├── promotion.route.ts
│   │   ├── voucher.route.ts
│   │   ├── review.route.ts
│   │   ├── statistics.route.ts
│   │   ├── tax_report.route.ts
│   │   └── upload.route.ts
│   │
│   ├── middlewares/                  # Middleware functions
│   │   ├── auth.middleware.ts
│   │   ├── security.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── order.middleware.ts
│   │
│   ├── dtos/                         # Data Transfer Objects
│   │   ├── auth/
│   │   ├── user/
│   │   ├── product/
│   │   └── ...
│   │
│   ├── repositories/                 # Database repositories
│   │
│   ├── schedulers/                   # Cron jobs & scheduled tasks
│   │   ├── embedding.scheduler.ts
│   │   └── promotion.scheduler.ts
│   │
│   ├── utils/                        # Utility functions
│   │   ├── logger.ts
│   │   ├── initialize_search.ts
│   │   ├── product.util.ts
│   │   └── promotion.util.ts
│   │
│   ├── migrations/                   # Database migrations
│   │   └── add_product_embedding.ts
│   │
│   ├── html/                         # HTML templates (emails, invoices)
│   │
│   └── app.ts                        # Express app setup
│
├── public/                           # Static files
│
├── logs/                             # Log files (generated)
│   ├── combined.log
│   └── error.log
│
├── server.ts                         # Server entry point
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── docker-compose.yaml               # Docker services
├── .env                              # Environment variables (create this)
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Prettier config
├── README.md                         # Main documentation
├── CHATBOT_README.md                 # Chatbot guide
└── REALTIME_CHAT_README.md           # WebSocket chat guide
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

Hầu hết các endpoints yêu cầu JWT token trong header:

```
Authorization: Bearer <access_token>
```

### API Modules

#### 🔐 Authentication (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/auth/login` | Đăng nhập | ❌ |
| POST | `/auth/refresh-token` | Refresh access token | ✅ |
| POST | `/auth/logout` | Đăng xuất | ✅ |

#### 👤 Users (`/users`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/users/profile` | Lấy thông tin profile | ✅ | USER |
| PUT | `/users/profile` | Cập nhật profile | ✅ | USER |
| GET | `/users` | Lấy danh sách users | ✅ | ADMIN |
| GET | `/users/:id` | Lấy thông tin user | ✅ | ADMIN |
| PUT | `/users/:id` | Cập nhật user | ✅ | ADMIN |
| DELETE | `/users/:id` | Xóa user | ✅ | ADMIN |

#### 📦 Products (`/products`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/products` | Lấy danh sách sản phẩm | ❌ | - |
| GET | `/products/search` | Tìm kiếm sản phẩm | ❌ | - |
| GET | `/products/:id` | Chi tiết sản phẩm | ❌ | - |
| POST | `/products` | Tạo sản phẩm mới | ✅ | ADMIN |
| PUT | `/products/:id` | Cập nhật sản phẩm | ✅ | ADMIN |
| DELETE | `/products/:id` | Xóa sản phẩm | ✅ | ADMIN |

#### 🗂 Categories (`/categories`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/categories` | Lấy danh sách categories | ❌ | - |
| GET | `/categories/:id` | Chi tiết category | ❌ | - |
| POST | `/categories` | Tạo category | ✅ | ADMIN |
| PUT | `/categories/:id` | Cập nhật category | ✅ | ADMIN |
| DELETE | `/categories/:id` | Xóa category | ✅ | ADMIN |

#### 🛒 Cart (`/carts`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/carts` | Lấy giỏ hàng hiện tại | ✅ |
| POST | `/carts/items` | Thêm sản phẩm vào giỏ | ✅ |
| PUT | `/carts/items/:id` | Cập nhật số lượng | ✅ |
| DELETE | `/carts/items/:id` | Xóa sản phẩm khỏi giỏ | ✅ |
| DELETE | `/carts/clear` | Xóa toàn bộ giỏ hàng | ✅ |

#### 📋 Orders (`/orders`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/orders` | Lấy danh sách đơn hàng | ✅ | USER |
| GET | `/orders/:id` | Chi tiết đơn hàng | ✅ | USER |
| POST | `/orders` | Tạo đơn hàng mới | ✅ | USER |
| PUT | `/orders/:id/status` | Cập nhật trạng thái | ✅ | ADMIN |
| PUT | `/orders/:id/cancel` | Hủy đơn hàng | ✅ | USER |

#### 💳 Payment (`/payments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/vnpay/create` | Tạo payment URL | ✅ |
| GET | `/payments/vnpay/callback` | VNPay callback | ❌ |
| GET | `/payments/vnpay/return` | VNPay return URL | ❌ |

#### 🤖 Chatbot (`/chatbot`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/chatbot/chat` | Chat với AI bot | ✅ |
| DELETE | `/chatbot/conversation/:id` | Xóa conversation | ✅ |
| GET | `/chatbot/history` | Lấy lịch sử chat | ✅ |

#### 💬 Conversations (`/conversations`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/conversations` | Lấy danh sách conversations | ✅ | USER |
| GET | `/conversations/:id` | Chi tiết conversation | ✅ | USER |
| POST | `/conversations` | Tạo conversation mới | ✅ | USER |
| PUT | `/conversations/:id/switch-to-human` | Chuyển sang nhân viên | ✅ | USER |
| PUT | `/conversations/:id/switch-to-bot` | Chuyển về bot | ✅ | ADMIN |
| PUT | `/conversations/:id/assign` | Gán agent | ✅ | ADMIN |

#### 🏭 Warehouses (`/warehouses`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/warehouses` | Lấy danh sách kho | ✅ | ADMIN |
| POST | `/warehouses` | Tạo kho mới | ✅ | ADMIN |
| PUT | `/warehouses/:id` | Cập nhật kho | ✅ | ADMIN |

#### 📊 Inventory (`/inventories`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/inventories` | Lấy tồn kho | ✅ | ADMIN |
| GET | `/inventories/variant/:id` | Tồn kho theo variant | ✅ | ADMIN |

#### 📦 Stock Entries (`/stock-entries`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/stock-entries` | Danh sách phiếu kho | ✅ | ADMIN |
| POST | `/stock-entries` | Tạo phiếu kho | ✅ | ADMIN |
| PUT | `/stock-entries/:id/approve` | Duyệt phiếu | ✅ | ADMIN |
| PUT | `/stock-entries/:id/complete` | Hoàn thành | ✅ | ADMIN |

#### 🎁 Promotions (`/promotions`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/promotions` | Danh sách khuyến mãi | ❌ | - |
| POST | `/promotions` | Tạo khuyến mãi | ✅ | ADMIN |
| PUT | `/promotions/:id` | Cập nhật | ✅ | ADMIN |
| DELETE | `/promotions/:id` | Xóa | ✅ | ADMIN |

#### 🎫 Vouchers (`/vouchers`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/vouchers` | Danh sách vouchers | ❌ | - |
| POST | `/vouchers/validate` | Validate voucher | ✅ | USER |
| POST | `/vouchers` | Tạo voucher | ✅ | ADMIN |
| PUT | `/vouchers/:id` | Cập nhật | ✅ | ADMIN |

#### ⭐ Reviews (`/reviews`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reviews/product/:id` | Reviews của sản phẩm | ❌ |
| POST | `/reviews` | Tạo review | ✅ |
| PUT | `/reviews/:id` | Cập nhật review | ✅ |
| DELETE | `/reviews/:id` | Xóa review | ✅ |

#### 📊 Statistics (`/statistics`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/statistics/revenue` | Thống kê doanh thu | ✅ | ADMIN |
| GET | `/statistics/top-products` | Top sản phẩm | ✅ | ADMIN |
| GET | `/statistics/orders` | Thống kê đơn hàng | ✅ | ADMIN |

#### 📄 Tax Reports (`/reports/tax`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/reports/tax/export` | Export báo cáo thuế | ✅ | ADMIN |

#### 📤 Upload (`/uploads`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/uploads/image` | Upload hình ảnh | ✅ |
| POST | `/uploads/video` | Upload video | ✅ |

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `{ conversationId }` | Tham gia conversation |
| `send_message` | `{ conversationId, message }` | Gửi tin nhắn |
| `typing` | `{ conversationId }` | Đang gõ |
| `switch_to_human` | `{ conversationId }` | Chuyển sang nhân viên |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ message }` | Tin nhắn mới |
| `typing` | `{ userId, conversationId }` | Người khác đang gõ |
| `conversation_updated` | `{ conversation }` | Conversation thay đổi |
| `error` | `{ message }` | Lỗi |

---

## 🔒 Bảo Mật

### Authentication & Authorization

- **JWT Tokens**:
  - Access Token: 15 phút (cho requests thường)
  - Refresh Token: 7 ngày (lưu trong httpOnly cookie)
  - Token rotation để tăng security

- **Password Security**:
  - Bcrypt hashing với 12 salt rounds
  - Password strength validation
  - No plain text storage

### Rate Limiting

```typescript
// General API endpoints
100 requests / 15 minutes per IP

// Authentication endpoints
5 requests / 15 minutes per IP (strict)

// Speed limiting
Gradual slowdown on excessive requests
```

### Security Headers (Helmet)

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### Input Validation & Sanitization

- **class-validator**: Decorator-based validation
- **class-sanitizer**: Automatic input sanitization
- **joi**: Schema validation
- **express-validator**: Request validation

Chống:
- SQL Injection
- XSS (Cross-Site Scripting)
- NoSQL Injection
- Command Injection

### CORS Configuration

```typescript
// Configurable allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

// Credentials support
credentials: true
```

### Environment Variables Security

- Sử dụng `.env` file (không commit vào Git)
- Validation tất cả env vars khi startup
- Fail-fast nếu thiếu env vars quan trọng

---

## 💾 Database Schema

### Core Entities

#### Users
- `id`, `email`, `password`, `fullname`, `role`, `avatar`, `phone`
- Relations: orders, reviews, cart, conversations

#### Products
- `id`, `name`, `slug`, `description`, `category_id`, `tags`, `rating`, `embedding`
- Relations: variants, category, reviews, promotions

#### Variants
- `id`, `product_id`, `sku`, `size`, `color_id`, `price`, `discount_price`, `stock`
- Relations: product, color, cart_items, order_items

#### Orders
- `id`, `user_id`, `status`, `total_amount`, `shipping_address`, `payment_method`
- Relations: user, order_items, payments

#### Warehouses
- `id`, `code`, `name`, `address`, `is_active`
- Relations: inventories, stock_entries

#### Inventories
- `id`, `warehouse_id`, `variant_id`, `on_hand_quantity`, `reserved_quantity`
- Relations: warehouse, variant

#### Conversations
- `id`, `user_id`, `agent_id`, `type` (BOT/HUMAN), `status`, `last_message_at`
- Relations: user, agent, messages

### Database Migrations

Migrations được quản lý qua TypeORM:

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Indexes

- Email (unique)
- Product slug (unique)
- SKU (unique)
- Voucher code (unique)
- Order status (for filtering)
- Product category (for filtering)
- Vector embeddings (for similarity search)

---

## ⏰ Scheduled Tasks

### Embedding Scheduler

**Tần suất**: Chạy khi app khởi động + theo interval

**Chức năng**:
- Tự động tạo embeddings cho sản phẩm mới
- Cập nhật embeddings khi sản phẩm thay đổi
- Lưu vào database và Redis

**File**: `app/schedulers/embedding.scheduler.ts`

### Promotion Scheduler

**Tần suất**: Mỗi 1 phút

**Chức năng**:
- Tự động kích hoạt promotions khi đến `start_date`
- Tự động vô hiệu hóa khi hết `end_date`
- Cập nhật trạng thái: DRAFT → ACTIVE → EXPIRED

**File**: `app/schedulers/promotion.scheduler.ts`

### Custom Schedulers

Thêm scheduler mới trong `app/schedulers/`:

```typescript
import { scheduleJob } from 'node-schedule';

export const startMyScheduler = () => {
  // Chạy mỗi ngày lúc 0:00
  scheduleJob('0 0 * * *', async () => {
    // Logic here
  });
};
```

Đăng ký trong `server.ts`:

```typescript
import { startMyScheduler } from './app/schedulers/my.scheduler';
startMyScheduler();
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- user.test.ts

# Watch mode
npm run test:watch
```

### Testing Stack

- **Jest**: Testing framework
- **Supertest**: HTTP assertions
- **ts-jest**: TypeScript support

### Test Structure

```
__tests__/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Triệu chứng**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Giải pháp**:
```bash
# Kiểm tra PostgreSQL container
docker ps

# Restart container nếu cần
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### 2. Redis Connection Error

**Triệu chứng**:
```
Error: Redis connection to localhost:6379 failed
```

**Giải pháp**:
```bash
# Kiểm tra Redis container
docker ps | grep redis

# Restart Redis
docker-compose restart redis

# Kiểm tra Redis logs
docker-compose logs redis
```

#### 3. Gemini API Error

**Triệu chứng**:
```
Error: API key not valid
```

**Giải pháp**:
- Kiểm tra `GEMINI_API_KEY` trong `.env`
- Verify API key tại: https://makersuite.google.com/app/apikey
- Đảm bảo không có khoảng trắng thừa

#### 4. Port Already in Use

**Triệu chứng**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Giải pháp**:
```bash
# Tìm process đang dùng port
lsof -i :3000

# Kill process
kill -9 <PID>

# Hoặc đổi PORT trong .env
PORT=3001
```

#### 5. TypeORM Synchronization Issues

**Triệu chứng**:
- Schema không đồng bộ
- Missing columns

**Giải pháp**:
```bash
# Development: Set synchronize: true trong data_source.ts
# Production: Sử dụng migrations

# Drop và recreate database (CAUTION: Data loss!)
docker-compose down -v
docker-compose up -d
```

#### 6. Embedding Generation Fails

**Triệu chứng**:
- Products không có embeddings
- Semantic search không hoạt động

**Giải pháp**:
```bash
# Chạy lại embedding scheduler manually
npm run dev

# Check logs
tail -f logs/combined.log | grep embedding
```

### Debug Mode

Bật debug logging:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

Xem logs:

```bash
# Combined logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Filter specific service
tail -f logs/combined.log | grep chatbot
```

### Performance Issues

**Database Queries Slow**:
```bash
# Enable query logging trong TypeORM
logging: true

# Analyze slow queries
# Thêm indexes cho các columns thường query
```

**Redis Cache Miss**:
```bash
# Check Redis memory
docker exec -it <redis-container> redis-cli INFO memory

# Monitor cache hits/misses
docker exec -it <redis-container> redis-cli MONITOR
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork repository**
2. **Create feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push to branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open Pull Request**

### Commit Convention

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Tính năng mới
- `fix:` - Fix bug
- `docs:` - Documentation
- `style:` - Code style (formatting, etc.)
- `refactor:` - Refactoring
- `test:` - Thêm tests
- `chore:` - Maintenance tasks

### Code Style

- **Prettier**: Auto-formatting
- **ESLint**: Code linting
- **TypeScript**: Strict mode

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

### Pull Request Guidelines

- ✅ Clear description của changes
- ✅ Tests cho new features
- ✅ Documentation updates
- ✅ No breaking changes (hoặc note rõ ràng)
- ✅ Pass all CI checks

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

### Documentation

- 📖 [Main README](README.md)
- 🤖 [Chatbot Guide](CHATBOT_README.md)
- 💬 [Realtime Chat Guide](REALTIME_CHAT_README.md)

### Issues

Nếu gặp vấn đề, vui lòng tạo issue tại: [GitHub Issues](https://github.com/your-username/fashion-website-be/issues)

### Community

- 💬 [Discussions](https://github.com/your-username/fashion-website-be/discussions)
- 📧 Email: your-email@example.com

---

## 🙏 Acknowledgments

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Express.js](https://expressjs.com/)
- [TypeORM](https://typeorm.io/)
- [Google Gemini](https://ai.google.dev/)
- [Redis](https://redis.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Socket.io](https://socket.io/)

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/your-username/fashion-website-be?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/fashion-website-be?style=social)
![GitHub issues](https://img.shields.io/github/issues/your-username/fashion-website-be)
![GitHub license](https://img.shields.io/github/license/your-username/fashion-website-be)

---

<div align="center">
  <strong>Made with ❤️ by Your Team</strong>
  <br>
  <sub>Built with Node.js, TypeScript, and AI</sub>
</div>
