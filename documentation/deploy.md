# Hướng dẫn Deploy lên Neon (Database) + Render (Backend)

## Tổng quan

| Service | Platform | Free tier |
|---------|----------|-----------|
| Database (PostgreSQL) | Neon | 0.5GB, vĩnh viễn |
| Backend (NestJS) | Render | Vĩnh viễn, sleep sau 15 phút idle |

---

## Bước 1 — Tạo Database trên Neon

1. Truy cập [neon.tech](https://neon.tech) → **Sign Up** (dùng GitHub cho tiện)
2. **Create Project** → đặt tên (vd: `lion-shop`) → chọn region gần nhất (`Singapore` hoặc `Tokyo`)
3. Sau khi tạo xong, vào **Dashboard → Connection Details**
4. Chọn tab **Connection string** → copy chuỗi có dạng:
   ```
   postgresql://user:password@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   > Lưu lại chuỗi này, sẽ dùng ở Bước 3.

---

## Bước 2 — Chuẩn bị RSA Keys cho JWT

Chạy lệnh sau trên máy local để tạo cặp key:

```bash
# Tạo private key
openssl genrsa -out private.pem 2048

# Tạo public key từ private key
openssl rsa -in private.pem -pubout -out public.pem

# Xem nội dung để copy
cat private.pem
cat public.pem
```

> **Lưu ý:** Giữ file `private.pem` bí mật, không commit lên Git.

---

## Bước 3 — Deploy Backend lên Render

### 3.1 Tạo Web Service

1. Truy cập [render.com](https://render.com) → **Sign Up** (dùng GitHub)
2. **New** → **Web Service**
3. Chọn repo GitHub chứa project này → **Connect**
4. Cấu hình:
   - **Name:** `lion-shop-backend`
   - **Runtime:** `Docker`
   - **Branch:** `main`
   - **Dockerfile Path:** `./Dockerfile`
   - **Plan:** `Free`
5. Nhấn **Create Web Service**

### 3.2 Cấu hình Environment Variables

Sau khi tạo xong, vào **Environment** → thêm các biến sau:

| Key | Giá trị |
|-----|---------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | Connection string từ Neon (Bước 1) |
| `POSTGRES_POOL_SIZE` | `5` |
| `PRIVATE_KEY` | Toàn bộ nội dung `private.pem` |
| `PUBLIC_KEY` | Toàn bộ nội dung `public.pem` |
| `ALLOWED_ORIGINS` | URL frontend (vd: `https://lion-shop.vercel.app`) |
| `GOOGLE_CLIENT_ID` | Client ID từ Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret từ Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://<tên-service>.onrender.com/auth/google/callback` |

> **Lưu ý khi nhập `PRIVATE_KEY` và `PUBLIC_KEY`:**
> Copy toàn bộ nội dung file kể cả dòng `-----BEGIN...-----` và `-----END...-----`.
> Render tự xử lý newline trong env var, không cần escape `\n`.

### 3.3 Deploy

- Nhấn **Manual Deploy** → **Deploy latest commit**
- Render sẽ build Docker image → chạy migration → khởi động app
- Theo dõi log ở tab **Logs**, chờ thấy dòng:
  ```
  Running database migrations...
  Starting application...
  Application is running on: http://0.0.0.0:3000
  ```

---

## Bước 4 — Kiểm tra sau deploy

### Swagger UI
```
https://<tên-service>.onrender.com/api
```

### Health check
```
https://<tên-service>.onrender.com/health-check
```

---

## Bước 5 — Cấu hình Google OAuth (nếu dùng)

1. Vào [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Chỉnh sửa OAuth 2.0 Client ID → **Authorized redirect URIs** → thêm:
   ```
   https://<tên-service>.onrender.com/auth/google/callback
   ```
3. Cập nhật `GOOGLE_CALLBACK_URL` trong Render dashboard cho khớp

---

## Lưu ý quan trọng

### Cold Start
Render free tier sẽ **sleep sau 15 phút không có request**. Lần đầu gọi API sau khi sleep sẽ mất ~30 giây để khởi động lại.

**Fix đơn giản:** Dùng service ping miễn phí như [UptimeRobot](https://uptimerobot.com) để ping endpoint `/health-check` mỗi 10 phút → app không bao giờ sleep.

### Database Neon
- Neon auto-suspend connection khi idle (~5 phút), nhưng **không xóa data**
- Khi có request mới, connection tự wake up trong ~1-2 giây
- `connectionTimeoutMillis: 5000` trong config đã đủ để handle cold start của Neon

### Chạy Migration thủ công (nếu cần)
Khi có migration mới, chỉ cần push code lên GitHub → Render tự build lại và chạy migration trong `docker-entrypoint.sh`.

---

## Tóm tắt flow

```
Push code lên GitHub
       ↓
Render detect thay đổi → Build Docker image
       ↓
docker-entrypoint.sh chạy: migration:run → node dist/main
       ↓
App kết nối Neon PostgreSQL qua DATABASE_URL
       ↓
API sẵn sàng tại https://<tên-service>.onrender.com
```
