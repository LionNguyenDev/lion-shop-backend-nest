# Lion Shop — Backend Design (NestJS + PostgreSQL)

> Tài liệu này mô tả toàn bộ API hiện tại của Next.js frontend, thiết kế database PostgreSQL tương đương, và hướng dẫn migrate sang NestJS backend.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Database Schema (PostgreSQL)](#2-database-schema-postgresql)
3. [Auth Module](#3-auth-module)
4. [Products Module](#4-products-module)
5. [Orders Module](#5-orders-module)
6. [Customers Module](#6-customers-module)
7. [Order Notes Module](#7-order-notes-module)
8. [Stats Module](#8-stats-module)
9. [Enums & Constants](#9-enums--constants)
10. [Response format chuẩn](#10-response-format-chuẩn)

---

## 1. Tổng quan kiến trúc

```
Next.js Frontend  ──REST──►  NestJS Backend  ──TypeORM──►  PostgreSQL
                                   │
                                   └──JWT (Google OAuth2)──► Google
```

**Tech stack đề xuất cho NestJS backend:**
- `@nestjs/passport` + `passport-google-oauth20` — Google OAuth
- `@nestjs/jwt` — phát hành JWT sau khi login
- `@nestjs/typeorm` + `typeorm` — ORM cho PostgreSQL
- `class-validator` + `class-transformer` — DTO validation
- `@nestjs/swagger` — tự động sinh API docs

---

## 2. Database Schema (PostgreSQL)

### ERD tổng quan

```
users ─────────────── (không FK trực tiếp, chỉ dùng cho auth/admin)

products ──────────── order_items ──────────── orders ──── customers (optional FK)
                                                  │
                                               order_notes (liên kết qua orderCode string)
```

---

### 2.1 Bảng `users`

Lưu tài khoản nội bộ (staff + admin). Auth bằng Google OAuth — **không lưu password**.

```sql
CREATE TABLE users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id   VARCHAR(64) UNIQUE NOT NULL,          -- sub từ Google token
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  avatar_url  TEXT,
  role        VARCHAR(20) NOT NULL DEFAULT 'user'   -- 'admin' | 'user'
    CHECK (role IN ('admin', 'user')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column | Type | Mô tả |
|---|---|---|
| `id` | UUID | PK, tự sinh |
| `google_id` | VARCHAR | `sub` từ Google ID token, unique |
| `email` | VARCHAR | Email Google, unique |
| `name` | VARCHAR | Tên hiển thị từ Google profile |
| `avatar_url` | TEXT | Ảnh đại diện Google |
| `role` | ENUM | `admin` — toàn quyền; `user` — chỉ xem |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Cập nhật qua trigger hoặc TypeORM `@UpdateDateColumn` |

---

### 2.2 Bảng `products`

Sản phẩm trong shop, có stock tách biệt theo 3 kho.

```sql
CREATE TABLE products (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255)  NOT NULL,
  brand           VARCHAR(100)  NOT NULL,
  type            VARCHAR(100)  NOT NULL,
  original_price  BIGINT        NOT NULL CHECK (original_price >= 0),  -- VND, đơn vị đồng
  selling_price   BIGINT        NOT NULL CHECK (selling_price >= 0),
  stock_hn        INT           NOT NULL DEFAULT 0 CHECK (stock_hn >= 0),
  stock_qb        INT           NOT NULL DEFAULT 0 CHECK (stock_qb >= 0),
  stock_sg        INT           NOT NULL DEFAULT 0 CHECK (stock_sg >= 0),
  image_url       TEXT          NOT NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_name  ON products USING gin(to_tsvector('simple', name));
```

| Column | Type | Mô tả |
|---|---|---|
| `original_price` | BIGINT | Giá nhập (VND). Dùng BIGINT tránh float |
| `selling_price` | BIGINT | Giá bán. Có thể bị override ở `order_items` |
| `stock_hn` | INT | Tồn kho kho Hà Nội |
| `stock_qb` | INT | Tồn kho kho Quảng Bình |
| `stock_sg` | INT | Tồn kho kho Sài Gòn |
| `image_url` | TEXT | URL ảnh sản phẩm |

> **Computed field:** `stock` tổng = `stock_hn + stock_qb + stock_sg` — tính tại query, không lưu.

---

### 2.3 Bảng `customers`

Khách hàng được tạo tự động hoặc thủ công khi có đơn hàng.

```sql
CREATE TABLE customers (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  phone        VARCHAR(20)  UNIQUE NOT NULL,
  address      TEXT,
  order_count  INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name  ON customers(lower(name));
```

| Column | Mô tả |
|---|---|
| `phone` | Unique — dùng làm key upsert khi tạo đơn |
| `order_count` | Đếm số đơn — tăng mỗi khi tạo order mới |

---

### 2.4 Bảng `orders`

Đơn hàng. Thông tin khách hàng được **denormalize** vào order (name, phone, address) để giữ lại dữ liệu lịch sử kể cả khi customer thay đổi.

```sql
CREATE TYPE order_status AS ENUM ('Unpaid', 'Paid');
CREATE TYPE warehouse_code AS ENUM ('HN', 'QB', 'SG');

CREATE TABLE orders (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID          REFERENCES customers(id) ON DELETE SET NULL,
  -- Snapshot thông tin khách tại thời điểm đặt hàng
  customer_name VARCHAR(255)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  address       TEXT          NOT NULL DEFAULT '',
  status        order_status  NOT NULL DEFAULT 'Unpaid',
  warehouse     warehouse_code NOT NULL,
  total_amount  BIGINT        NOT NULL CHECK (total_amount >= 0),
  profit        BIGINT        NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_created_at  ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status_time ON orders(status, created_at DESC);
```

| Column | Mô tả |
|---|---|
| `customer_id` | FK nullable — link về customer (có thể null nếu khách vãng lai) |
| `customer_name` | Snapshot tên khách tại lúc đặt |
| `total_amount` | Tổng tiền (VND) = Σ(price × quantity) |
| `profit` | Lợi nhuận = Σ((price − original_price) × quantity) |
| `warehouse` | Kho xuất hàng: `HN` / `QB` / `SG` |

---

### 2.5 Bảng `order_items`

Chi tiết từng sản phẩm trong đơn hàng.

```sql
CREATE TABLE order_items (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      UUID    REFERENCES products(id) ON DELETE SET NULL,
  -- Snapshot tên sản phẩm tại thời điểm đặt
  product_name    VARCHAR(255) NOT NULL,
  quantity        INT     NOT NULL CHECK (quantity >= 1),
  price           BIGINT  NOT NULL CHECK (price >= 0),           -- giá bán thực tế
  original_price  BIGINT  NOT NULL CHECK (original_price >= 0)   -- giá vốn
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

| Column | Mô tả |
|---|---|
| `product_id` | FK nullable — product có thể bị xóa, order vẫn giữ lịch sử |
| `product_name` | Snapshot tên sản phẩm |
| `price` | Giá bán trong đơn này (có thể khác `products.selling_price`) |
| `original_price` | Giá vốn snapshot tại thời điểm đặt |

---

### 2.6 Bảng `order_notes`

Ghi chú nội bộ gắn với mã đơn (orderCode là string tự do, không FK).

```sql
CREATE TABLE order_notes (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code  VARCHAR(100) NOT NULL,
  note        TEXT  NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_notes_order_code ON order_notes(order_code);
CREATE INDEX idx_order_notes_created_at ON order_notes(created_at DESC);
```

---

### 2.7 Bảng `order_note_products`

Danh sách sản phẩm đính kèm một note (embedded array trong MongoDB → bảng phụ trong PostgreSQL).

```sql
CREATE TABLE order_note_products (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  order_note_id  UUID  NOT NULL REFERENCES order_notes(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  quantity       INT  NOT NULL DEFAULT 1 CHECK (quantity >= 1)
);

CREATE INDEX idx_onp_note_id ON order_note_products(order_note_id);
```

---

## 3. Auth Module

### Tổng quan

Authentication hoàn toàn qua **Google OAuth2**. Backend NestJS đã có sẵn phần login Google. Sau khi xác thực, backend phát hành **JWT** gửi về frontend để dùng cho mọi request tiếp theo.

### Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/auth/google` | Public | Redirect sang Google OAuth |
| `GET` | `/auth/google/callback` | Public | Google callback — tạo/upsert user, trả về JWT |
| `GET` | `/auth/me` | JWT Required | Trả về thông tin user hiện tại từ JWT |
| `POST` | `/auth/signout` | JWT Required | Phía client xóa token (stateless JWT — server không cần làm gì, trừ khi dùng blacklist) |

### JWT Payload

```json
{
  "sub": "uuid-của-user",
  "email": "user@gmail.com",
  "name": "Nguyễn Thuỳ Linh",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700604800
}
```

### Flow Google OAuth

```
1. Frontend → GET /auth/google
2. Backend  → redirect Google consent screen
3. Google   → callback /auth/google/callback?code=...
4. Backend  → exchange code → Google user info
5. Backend  → upsert user (google_id, email, name, avatar_url)
6. Backend  → sign JWT → trả về token (cookie HttpOnly hoặc JSON)
7. Frontend → lưu JWT, gắn vào mọi request header: Authorization: Bearer <token>
```

### Role-based Guard

- `admin` — toàn quyền CRUD tất cả module
- `user` — chỉ đọc (GET), không tạo/sửa/xóa

---

## 4. Products Module

### Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/products` | JWT | Lấy danh sách sản phẩm (phân trang, tìm kiếm, lọc brand) |
| `GET` | `/products/:id` | JWT | Lấy chi tiết 1 sản phẩm |
| `POST` | `/products` | Admin | Tạo sản phẩm mới |
| `PUT` | `/products/:id` | Admin | Cập nhật toàn bộ thông tin sản phẩm |
| `DELETE` | `/products/:id` | Admin | Xóa sản phẩm |

### Query params — GET /products

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `search` | string | — | Full-text search theo tên sản phẩm |
| `brand` | string | — | Lọc theo thương hiệu (exact match, case-insensitive) |
| `page` | number | `1` | Trang hiện tại |
| `limit` | number | `10` | Số item/trang (max 500) |

### Response — GET /products

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Kem chống nắng SPF50",
      "brand": "Skin1004",
      "type": "Skincare",
      "originalPrice": 180000,
      "sellingPrice": 250000,
      "stockHN": 10,
      "stockQB": 5,
      "stockSG": 8,
      "stock": 23,
      "imageUrl": "https://...",
      "createdAt": "2026-05-01T00:00:00Z",
      "updatedAt": "2026-05-20T00:00:00Z"
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 10,
  "totalPages": 12
}
```

### Request Body — POST/PUT /products

```json
{
  "name": "Kem chống nắng SPF50",
  "brand": "Skin1004",
  "type": "Skincare",
  "originalPrice": 180000,
  "sellingPrice": 250000,
  "stockHN": 10,
  "stockQB": 5,
  "stockSG": 8,
  "imageUrl": "https://cdn.example.com/image.jpg"
}
```

### Business logic

- `stock` tổng = `stockHN + stockQB + stockSG` — computed, không lưu DB
- Khi tạo đơn hàng thành công, trừ tồn kho theo `warehouse` của đơn
- `lowStockThreshold` = 5 (nếu `stock` ≤ 5 → cảnh báo tồn kho thấp)

---

## 5. Orders Module

### Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/orders` | JWT | Lấy tất cả đơn hàng (có thể thêm filter sau) |
| `POST` | `/orders` | Admin | Tạo đơn hàng mới |
| `PATCH` | `/orders/:id` | Admin | Cập nhật đơn hàng (status, thông tin KH, items) |
| `DELETE` | `/orders/:id` | Admin | Xóa đơn hàng |

### Request Body — POST /orders

```json
{
  "items": [
    {
      "productId": "uuid-sản-phẩm",
      "productName": "Kem chống nắng SPF50",
      "quantity": 2,
      "price": 240000,
      "originalPrice": 180000
    }
  ],
  "customerName": "Nguyễn Khánh Linh",
  "phone": "0901234567",
  "address": "123 Nguyễn Trãi, Q.1, TP.HCM",
  "warehouse": "SG",
  "status": "Unpaid"
}
```

### Response — POST /orders (201 Created)

```json
{
  "id": "uuid-đơn-hàng",
  "items": [...],
  "totalAmount": 480000,
  "profit": 120000,
  "status": "Unpaid",
  "warehouse": "SG",
  "customerName": "Nguyễn Khánh Linh",
  "phone": "0901234567",
  "address": "123 Nguyễn Trãi",
  "createdAt": "2026-05-29T10:00:00Z",
  "updatedAt": "2026-05-29T10:00:00Z"
}
```

### Request Body — PATCH /orders/:id

```json
{
  "customerName": "Linh Nguyễn",
  "phone": "0901234567",
  "address": "456 Lê Lợi",
  "status": "Paid",
  "items": [ ... ]
}
```

### Business logic

- `totalAmount` = Σ(`price × quantity`) — tính tự động server-side
- `profit` = Σ((`price − originalPrice`) × quantity) — tính tự động
- Khi tạo đơn: **upsert customer** theo `phone` (tăng `order_count`)
- Khi xóa đơn: không hoàn lại tồn kho tự động (xử lý thủ công)
- Validation:
  - `items` phải có ít nhất 1 item
  - `customerName` bắt buộc
  - `phone` bắt buộc
  - `warehouse` phải thuộc `['HN', 'QB', 'SG']`
  - `status` phải thuộc `['Unpaid', 'Paid']`

---

## 6. Customers Module

### Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/customers` | JWT | Danh sách khách hàng (phân trang, tìm kiếm) |
| `GET` | `/customers?phone=xxx` | JWT | Tìm khách theo số điện thoại (exact) |
| `GET` | `/customers?name=xxx` | JWT | Tìm khách theo tên (fuzzy) |
| `PATCH` | `/customers/:id` | Admin | Cập nhật thông tin khách hàng |

### Query params — GET /customers

| Param | Type | Mô tả |
|---|---|---|
| `phone` | string | Tìm chính xác theo SĐT (dùng khi tạo đơn) |
| `name` | string | Tìm theo tên (trả về list) |
| `search` | string | Tìm theo tên hoặc SĐT |
| `page` | number | Trang (default 1) |
| `pageSize` | number | Số item/trang (default 20, max 100) |

### Response — GET /customers (list)

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Nguyễn Khánh Linh",
      "phone": "0901234567",
      "address": "TP. Hồ Chí Minh",
      "orderCount": 5,
      "createdAt": "2026-01-10T00:00:00Z",
      "updatedAt": "2026-05-20T00:00:00Z"
    }
  ],
  "total": 250,
  "page": 1,
  "pageSize": 20
}
```

### Request Body — PATCH /customers/:id

```json
{
  "name": "Linh Nguyễn",
  "phone": "0901234567",
  "address": "456 Trần Hưng Đạo, Q.5"
}
```

### Business logic

- Customer được **upsert tự động** khi tạo đơn hàng (match theo `phone`)
- `orderCount` tăng 1 mỗi khi tạo đơn mới với `phone` đó
- Không có endpoint DELETE customer (giữ lịch sử)

---

## 7. Order Notes Module

Ghi chú nội bộ dùng để track thông tin bổ sung của đơn (không hiển thị cho khách).

### Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/order-notes` | JWT | Lấy tất cả order notes |
| `POST` | `/order-notes` | Admin | Tạo order note mới |
| `PATCH` | `/order-notes/:id` | Admin | Cập nhật order note |
| `DELETE` | `/order-notes/:id` | Admin | Xóa order note |

### Request Body — POST /order-notes

```json
{
  "orderCode": "DH-2026-001",
  "products": [
    { "name": "Kem chống nắng SPF50", "quantity": 2 },
    { "name": "Son tint đỏ", "quantity": 1 }
  ],
  "note": "Khách yêu cầu gói quà, kèm thiệp sinh nhật"
}
```

### Response — GET /order-notes

```json
[
  {
    "id": "uuid",
    "orderCode": "DH-2026-001",
    "products": [
      { "name": "Kem chống nắng SPF50", "quantity": 2 }
    ],
    "note": "Khách yêu cầu gói quà",
    "createdAt": "2026-05-29T10:00:00Z",
    "updatedAt": "2026-05-29T10:00:00Z"
  }
]
```

### Validation

- `orderCode` bắt buộc
- `products` phải có ít nhất 1 phần tử, mỗi phần tử phải có `name`
- `note` bắt buộc

---

## 8. Stats Module

### Endpoint

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/stats` | JWT | Tổng hợp doanh thu, lợi nhuận, số đơn theo khoảng thời gian |

### Query params

| Param | Values | Default | Mô tả |
|---|---|---|---|
| `range` | `today` \| `7d` \| `30d` \| `365d` | `7d` | Khoảng thời gian thống kê |

### Response

```json
{
  "range": "7d",
  "current": {
    "orders": 42,
    "revenue": 15600000,
    "profit": 4200000,
    "buckets": [
      { "bucket": "2026-05-23", "orders": 5, "revenue": 1800000, "profit": 540000 },
      { "bucket": "2026-05-24", "orders": 8, "revenue": 2400000, "profit": 720000 }
    ]
  },
  "previous": {
    "orders": 35,
    "revenue": 12000000,
    "profit": 3200000,
    "buckets": [...]
  }
}
```

### Business logic

- **Chỉ tính đơn có `status = 'Paid'`** cho `revenue` và `profit`
- `orders` đếm tất cả đơn (cả Unpaid và Paid)
- Múi giờ: **Asia/Ho_Chi_Minh (UTC+7)**
- Bucket format theo `range`:
  - `today` → theo giờ: `"08"`, `"09"`, ...
  - `7d` / `30d` → theo ngày: `"2026-05-29"`
  - `365d` → theo tháng: `"2026-05"`
- So sánh với kỳ trước (`previous`) cùng độ dài — dùng để tính % tăng/giảm

### PostgreSQL query tham khảo (thay cho MongoDB aggregation)

```sql
-- Current period revenue/profit (Paid orders only)
SELECT
  TO_CHAR(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS bucket,
  COUNT(*)                                                            AS orders,
  SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END)        AS revenue,
  SUM(CASE WHEN status = 'Paid' THEN profit       ELSE 0 END)        AS profit
FROM orders
WHERE created_at >= :start AND created_at < :end
GROUP BY bucket
ORDER BY bucket ASC;
```

---

## 9. Enums & Constants

### Order Status

```typescript
enum OrderStatus {
  UNPAID = 'Unpaid',
  PAID   = 'Paid',
}
```

### Warehouse

```typescript
enum Warehouse {
  HN = 'HN',  // Hà Nội
  QB = 'QB',  // Quảng Bình
  SG = 'SG',  // Sài Gòn
}

const WAREHOUSE_LABELS = {
  HN: 'Hà Nội',
  QB: 'Quảng Bình',
  SG: 'Sài Gòn',
}
```

### User Role

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER  = 'user',
}
```

---

## 10. Response format chuẩn

### Success

```json
// Single resource
{ "id": "...", ...fields }

// Paginated list
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Error

```json
{
  "statusCode": 400,
  "message": "Customer name is required",
  "error": "Bad Request"
}
```

> NestJS mặc định đã dùng format này với `HttpException`. Chỉ cần dùng `BadRequestException`, `NotFoundException`,... là đủ.

---

## 11. Gợi ý cấu trúc NestJS

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts      # GET /auth/google, /auth/google/callback, /auth/me
│   ├── auth.service.ts
│   ├── google.strategy.ts      # passport-google-oauth20
│   ├── jwt.strategy.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   └── entities/user.entity.ts
│
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   ├── update-product.dto.ts
│   │   └── query-product.dto.ts
│   └── entities/product.entity.ts
│
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   └── update-order.dto.ts
│   └── entities/
│       ├── order.entity.ts
│       └── order-item.entity.ts
│
├── customers/
│   ├── customers.module.ts
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   ├── dto/
│   │   ├── update-customer.dto.ts
│   │   └── query-customer.dto.ts
│   └── entities/customer.entity.ts
│
├── order-notes/
│   ├── order-notes.module.ts
│   ├── order-notes.controller.ts
│   ├── order-notes.service.ts
│   ├── dto/
│   │   ├── create-order-note.dto.ts
│   │   └── update-order-note.dto.ts
│   └── entities/
│       ├── order-note.entity.ts
│       └── order-note-product.entity.ts
│
├── stats/
│   ├── stats.module.ts
│   ├── stats.controller.ts     # GET /stats?range=7d
│   └── stats.service.ts
│
└── common/
    ├── decorators/
    │   └── roles.decorator.ts   # @Roles('admin')
    ├── filters/
    │   └── http-exception.filter.ts
    └── interceptors/
        └── transform.interceptor.ts
```

---

## 12. Migration checklist

- [ ] Đổi `Authorization: Bearer <jwt>` header thay vì cookie
- [ ] Frontend: thêm `Authorization` header vào mọi API call
- [ ] Backend: cập nhật `BASE_URL` trong frontend env (`NEXT_PUBLIC_API_URL=http://localhost:3001`)
- [ ] Xử lý CORS trong NestJS (`app.enableCors(...)`)
- [ ] Giá tiền: đã dùng `BIGINT` — đảm bảo frontend gửi số nguyên (không float)
- [ ] Timezone: mọi timestamp lưu dạng `TIMESTAMPTZ` (UTC), hiển thị convert sang `+07:00`
