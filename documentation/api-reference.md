# Lion Shop — API Reference

## Thông tin chung

| | |
|-|-|
| **Base URL** | `https://lion-shop-backend.onrender.com` |
| **Swagger UI** | `https://lion-shop-backend.onrender.com/api` |
| **Auth** | JWT Bearer Token (RSA256) |
| **Content-Type** | `application/json` |

> **Lưu ý:** Hầu hết endpoint yêu cầu role `admin`. Chỉ `POST /auth/login` và `POST /auth/register` là public.

---

## Authentication

### Header cho các request cần auth
```
Authorization: Bearer <access_token>
```

---

### POST `/auth/register`
Tạo tài khoản mới (mặc định role `user`).

**Body:**
```json
{
  "name": "Nguyễn Văn A",
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "admin@example.com",
    "roles": "user",
    "isActive": true,
    "createdAt": "2026-06-01T00:00:00.000Z"
  }
}
```

---

### POST `/auth/login`
Đăng nhập bằng email + password.

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:** Giống `/auth/register`

---

### GET `/auth/me` 🔒
Lấy thông tin user hiện tại từ token.

**Response:**
```json
{
  "id": 1,
  "name": "Nguyễn Văn A",
  "email": "admin@example.com",
  "roles": "admin",
  "isActive": true,
  "googleId": null,
  "avatarUrl": null,
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

---

### GET `/auth/google`
Redirect đến Google OAuth login. Dùng trực tiếp trên browser.

### GET `/auth/google/callback`
Google redirect về sau khi login thành công → trả về `access_token`.

### POST `/auth/signout` 🔒
Stateless — client chỉ cần xóa token ở local. Endpoint này không làm gì server-side.

---

## Enums

### Role
| Value | Mô tả |
|-------|-------|
| `admin` | Toàn quyền |
| `user` | Không có quyền gọi API (chỉ dùng cho hệ thống) |

### OrderStatus
| Value | Mô tả |
|-------|-------|
| `Unpaid` | Chưa thanh toán |
| `Paid` | Đã thanh toán |

### Warehouse
| Value | Mô tả |
|-------|-------|
| `HN` | Kho Hà Nội |
| `QB` | Kho Quảng Bình |
| `SG` | Kho Sài Gòn |

### TaskStatus
| Value | Mô tả |
|-------|-------|
| `open` | Mới |
| `in_progress` | Đang làm |
| `done` | Xong |

### StatsRange
| Value | Mô tả |
|-------|-------|
| `today` | Hôm nay |
| `7d` | 7 ngày gần nhất |
| `30d` | 30 ngày gần nhất |
| `365d` | 1 năm gần nhất |

---

## Products 🔒 (admin only)

### GET `/products`
Danh sách sản phẩm, hỗ trợ tìm kiếm và phân trang.

**Query params:**
| Param | Type | Mô tả |
|-------|------|-------|
| `search` | string | Tìm theo tên sản phẩm |
| `brand` | string | Lọc theo brand |
| `page` | number | Trang (default: 1) |
| `limit` | number | Số item/trang (default: 10) |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Kem chống nắng SPF50",
      "brand": "Skin1004",
      "type": "Skincare",
      "originalPrice": 180000,
      "sellingPrice": 250000,
      "stockHN": 10,
      "stockQB": 5,
      "stockSG": 8,
      "stock": 23,
      "imageUrl": "https://cdn.example.com/image.jpg",
      "createdAt": "2026-06-01T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

> `stock` = `stockHN + stockQB + stockSG` (tổng tồn kho)

---

### GET `/products/:id`
Chi tiết 1 sản phẩm.

---

### POST `/products`
Tạo sản phẩm mới.

**Body:**
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

---

### PUT `/products/:id`
Cập nhật toàn bộ thông tin sản phẩm (tất cả field đều optional).

---

### DELETE `/products/:id`
Xóa sản phẩm. Response: `204 No Content`

---

## Orders 🔒 (admin only)

### GET `/orders`
Lấy tất cả đơn hàng (kèm `items`), sắp xếp mới nhất lên đầu.

**Response:**
```json
[
  {
    "id": 1,
    "customerId": 1,
    "customerName": "Nguyễn Khánh Linh",
    "phone": "0901234567",
    "address": "123 Nguyễn Trãi, Q.1, TP.HCM",
    "status": "Unpaid",
    "warehouse": "SG",
    "totalAmount": 500000,
    "profit": 140000,
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z",
    "items": [
      {
        "id": 1,
        "orderId": 1,
        "productId": 1,
        "productName": "Kem chống nắng SPF50",
        "quantity": 2,
        "price": 250000,
        "originalPrice": 180000
      }
    ]
  }
]
```

---

### GET `/orders/:id`
Chi tiết 1 đơn hàng.

---

### POST `/orders`
Tạo đơn hàng mới. Server tự lookup product để fill `productName`, `price`, `originalPrice`, tự tính `totalAmount`, `profit`, tự trừ kho, tự upsert khách hàng.

**Body:**
```json
{
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 3, "quantity": 1 }
  ],
  "customerName": "Nguyễn Khánh Linh",
  "phone": "0901234567",
  "address": "123 Nguyễn Trãi, Q.1, TP.HCM",
  "warehouse": "SG",
  "status": "Unpaid"
}
```

> `address` và `status` là optional. `status` default = `"Unpaid"`.

---

### PATCH `/orders/:id`
Cập nhật đơn hàng. Tất cả field đều optional.

**Body (ví dụ chỉ update status):**
```json
{ "status": "Paid" }
```

---

### DELETE `/orders/:id`
Xóa đơn hàng. Response: `204 No Content`

---

## Customers 🔒 (admin only)

> Khách hàng được tự động tạo/cập nhật khi tạo order. Không có endpoint tạo mới.

### GET `/customers`
Danh sách khách hàng, hỗ trợ tìm kiếm và phân trang.

**Query params:**
| Param | Type | Mô tả |
|-------|------|-------|
| `search` | string | Tìm theo tên hoặc SĐT |
| `page` | number | Trang (default: 1) |
| `limit` | number | Số item/trang (default: 20) |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Khánh Linh",
      "phone": "0901234567",
      "address": "123 Nguyễn Trãi",
      "orderCount": 5,
      "createdAt": "2026-06-01T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### GET `/customers/:id`
Chi tiết 1 khách hàng.

---

### PATCH `/customers/:id`
Cập nhật thông tin khách hàng (`name`, `address`).

---

## Order Notes 🔒 (admin only)
Ghi chú đơn hàng từ nguồn bên ngoài (ví dụ: Shopee, TikTok Shop).

### GET `/order-notes`
Lấy tất cả order notes (kèm `products`).

### GET `/order-notes/:id`

### POST `/order-notes`
**Body:**
```json
{
  "orderCode": "SHOP-2026-001",
  "note": "Giao hàng trước 5pm",
  "products": [
    { "name": "Kem chống nắng", "quantity": 2 },
    { "name": "Serum vitamin C", "quantity": 1 }
  ]
}
```

### PATCH `/order-notes/:id`
### DELETE `/order-notes/:id` → `204 No Content`

---

## Stats 🔒 (admin only)

### GET `/stats`
Thống kê doanh thu, lợi nhuận, số đơn.

**Query params:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `range` | StatsRange | `7d` | Khoảng thời gian |

**Response:**
```json
{
  "totalRevenue": 5000000,
  "totalProfit": 1200000,
  "totalOrders": 25,
  "paidOrders": 20,
  "unpaidOrders": 5
}
```

---

## Tasks 🔒 (admin only)
Quản lý công việc nội bộ.

### GET `/tasks`
### GET `/tasks/:id`
### POST `/tasks`
```json
{
  "title": "Kiểm kê kho HN",
  "description": "Kiểm kê toàn bộ sản phẩm",
  "status": "open"
}
```
### PATCH `/tasks/:id`
### DELETE `/tasks/:id` → `204 No Content`

---

## Users 🔒 (admin only)

### GET `/users/me`
Thông tin user hiện tại (giống `/auth/me`).

### GET `/users`
Danh sách tất cả users.

### GET `/users/:id`
### PATCH `/users/:id`
### DELETE `/users/:id` → `204 No Content`

---

## Cách dùng trong project khác

### 1. Lưu Base URL vào biến môi trường
```env
NEXT_PUBLIC_API_URL=https://lion-shop-backend.onrender.com
# hoặc
VITE_API_URL=https://lion-shop-backend.onrender.com
```

### 2. Login để lấy token
```javascript
const res = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
});
const { access_token } = await res.json();
// Lưu token vào localStorage hoặc cookie
localStorage.setItem('token', access_token);
```

### 3. Gọi API có auth
```javascript
const token = localStorage.getItem('token');

const res = await fetch(`${API_URL}/products`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await res.json();
```

### 4. Ví dụ tạo đơn hàng
```javascript
await fetch(`${API_URL}/orders`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [{ productId: 1, quantity: 2 }],
    customerName: 'Nguyễn Văn A',
    phone: '0901234567',
    warehouse: 'SG'
  })
});
```
