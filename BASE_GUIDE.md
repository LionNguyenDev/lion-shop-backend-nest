# NestJS Base Backend — Hướng dẫn sử dụng

> Đây là source base backend. Mỗi dự án mới, clone repo này và đọc file này trước.

---

## Tech Stack

| Thành phần | Package | Ghi chú |
|---|---|---|
| Framework | `@nestjs/common` v11 | |
| Database | `typeorm` + `pg` | PostgreSQL |
| Auth | `passport-jwt` + `passport-google-oauth20` | RSA256 |
| Validation | `class-validator` + `class-transformer` | |
| Docs | `@nestjs/swagger` | `/api` |
| Security | `helmet`, `bcryptjs` | |
| Config | `@nestjs/config` | `.env` |
| Test | `jest` + `supertest` | |

---

## Cấu trúc thư mục

```
src/
├── main.ts                          # Khởi động app
├── app.module.ts                    # Root module
├── custom.decorator.ts              # @Roles() decorator
│
├── config/
│   ├── index.ts                     # Map biến .env thành config object
│   └── database.ts                  # Cấu hình TypeORM (dùng cho migration CLI)
│
├── logger/
│   ├── logger.module.ts
│   └── logger.service.ts
│
├── migrations/                      # TypeORM migrations
│   └── *.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts           # /auth/login, /auth/register, /auth/google
│   ├── auth.service.ts              # Business logic xác thực
│   ├── dto/
│   │   └── login.dto.ts
│   └── strategy/
│       ├── jwt.strategy.ts          # Giải mã JWT → req.user
│       ├── jwt-auth.guard.ts        # Bảo vệ route bằng JWT
│       ├── google.strategy.ts       # Xác thực Google OAuth2
│       ├── google-auth.guard.ts     # Kích hoạt redirect Google
│       └── roles.guard.ts           # Kiểm tra role của user
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts          # CRUD /users/*
│   ├── users.service.ts             # Thao tác DB với User
│   ├── dto/
│   │   ├── create-user.dto.ts       # Dùng trong /auth/register
│   │   └── update-user.dto.ts       # Dùng trong PATCH /users/:id
│   ├── entities/
│   │   └── user.entity.ts           # Bảng user trong DB
│   └── enums/
│       └── role.enum.ts             # standard | premium
│
└── tasks/                           # Ví dụ về một feature module
    ├── tasks.module.ts
    ├── tasks.controller.ts
    ├── tasks.service.ts
    ├── dto/
    │   ├── create-task.dto.ts
    │   └── update-task.dto.ts
    └── entities/
        └── task.entity.ts
```

---

## Biến môi trường (`.env`)

Sao chép `.env.example` thành `.env` và điền đầy đủ:

```env
# Database
POSTGRES_HOST=0.0.0.0
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=postgres
POSTGRES_SSL=false
POSTGRES_SSL_REJECT_UNAUTHORIZED=true
POSTGRES_POOL_SIZE=10

# App
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# JWT (RSA256) — tạo bằng lệnh bên dưới
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"

# Google OAuth — lấy tại console.cloud.google.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Tạo RSA key pair

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

Copy nội dung 2 file vào `.env`, thay mỗi xuống dòng bằng `\n`.

---

## Các lệnh hay dùng

```bash
# Chạy dev
npm run start:dev

# Build production
npm run build && npm run start:prod

# Format + lint
npm run format
npm run lint

# Test
npm test
npm run test:cov

# Migration
npm run migration:generate -- src/migrations/TênMigration
npm run migration:run
npm run migration:revert

# Docker
npm run docker:up
npm run docker:down
```

---

## Toàn bộ API endpoints

### Auth — `/auth`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | Không | Đăng ký bằng email/password |
| POST | `/auth/login` | Không | Đăng nhập, trả `access_token` |
| GET | `/auth/google` | Không | Redirect sang Google |
| GET | `/auth/google/callback` | Không | Google callback, trả `access_token` |

**POST /auth/register body:**
```json
{ "email": "user@example.com", "name": "Nguyen Van A", "password": "12345678" }
```

**POST /auth/login body:**
```json
{ "email": "user@example.com", "password": "12345678" }
```

**Response chung cho login:**
```json
{ "email": "user@example.com", "access_token": "eyJhbGci..." }
```

---

### Users — `/users`

Tất cả route đều cần header: `Authorization: Bearer <access_token>`

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/users/me` | Bất kỳ | Profile của chính mình |
| GET | `/users` | premium | Danh sách tất cả user |
| GET | `/users/:id` | premium | Lấy 1 user |
| PATCH | `/users/:id` | premium | Cập nhật user |
| DELETE | `/users/:id` | premium | Xoá user (204) |

**PATCH /users/:id body (tất cả optional):**
```json
{ "name": "Tên mới", "isActive": false, "roles": "premium" }
```

---

### Tasks — `/tasks`

Tất cả route đều cần JWT. Đây là ví dụ feature module.

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/tasks` | Tạo task |
| GET | `/tasks` | Danh sách task |
| GET | `/tasks/:id` | Lấy 1 task |
| PATCH | `/tasks/:id` | Cập nhật task |
| DELETE | `/tasks/:id` | Xoá task |

---

## Luồng xác thực

### Email/Password login

```
POST /auth/login
  → AuthController.login()
  → AuthService.login()
    → UsersService.findOne(email)        # tìm user trong DB
    → compareSync(password, hash)        # kiểm tra password
    → jwtService.sign({ sub, email })    # ký JWT bằng RSA private key
  ← { email, access_token }
```

### Google OAuth login

```
GET /auth/google
  → GoogleAuthGuard → redirect sang Google

GET /auth/google/callback
  → GoogleAuthGuard → GoogleStrategy.validate()
    → UsersService.findOrCreateByGoogle()
      # Tìm theo googleId → tìm theo email → tạo mới
    → AuthService.googleLogin(user)
      → jwtService.sign({ sub, email })
  ← { email, access_token }
```

### Mỗi request có JWT

```
Header: Authorization: Bearer <token>
  → JwtAuthGuard
  → JwtStrategy.validate()
    → verify chữ ký bằng RSA public key
    → UsersService.findById(sub)
    → gắn user vào req.user
  → Controller nhận được req.user
```

---

## Database Entity

### User

```typescript
id        number    PK, auto increment
name      string
email     string    UNIQUE
password  string    nullable (Google user không có password)
googleId  string    nullable
isActive  boolean   default: true
roles     enum      standard | premium, default: standard
```

### Task (ví dụ)

```typescript
id          number    PK, auto increment
title       string
description string    nullable
status      enum      open | in_progress | done, default: open
createdAt   Date      auto
updatedAt   Date      auto
```

---

## Các khái niệm cốt lõi

### Guard

Guard chạy **trước** khi vào controller, quyết định có cho phép request không.

```
Request → Guard(s) → Controller
```

| Guard | Khi nào dùng |
|---|---|
| `JwtAuthGuard` | Route cần đăng nhập |
| `RolesGuard` | Route cần role cụ thể (dùng kèm `@Roles()`) |
| `GoogleAuthGuard` | Chỉ dùng cho 2 route Google OAuth |

### DTO

DTO (Data Transfer Object) là class định nghĩa shape và validation của request body.

- `class-validator` decorator (`@IsString`, `@IsEmail`...) để validate
- `class-transformer` để transform (ví dụ `@Transform`)
- `ValidationPipe` trong `main.ts` tự động validate và throw 400 nếu sai

### Entity

Entity là class ánh xạ với bảng trong database (TypeORM).

- `@Entity()` → tên bảng
- `@Column()` → cột
- `@PrimaryGeneratedColumn()` → primary key tự tăng
- Khi thay đổi entity → tạo migration, **không dùng `synchronize: true` trong production**

### Strategy (Passport)

Strategy là logic xác thực cụ thể của từng phương thức auth.

- `JwtStrategy` — đọc token từ header, verify, trả về user
- `GoogleStrategy` — nhận OAuth code từ Google, lấy profile, trả về user

---

## Cách thêm một feature module mới

Ví dụ thêm module `products`:

**1. Tạo bằng CLI:**
```bash
nest generate module products
nest generate controller products
nest generate service products
```

**2. Tạo entity** `src/products/entities/product.entity.ts`:
```typescript
@Entity()
export class Product {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column('decimal') price: number;
}
```

**3. Tạo DTOs** `src/products/dto/create-product.dto.ts`

**4. Inject repository vào service:**
```typescript
constructor(
  @InjectRepository(Product)
  private readonly repo: Repository<Product>,
) {}
```

**5. Import TypeOrmModule vào module:**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  ...
})
```

**6. Tạo migration:**
```bash
npm run migration:generate -- src/migrations/AddProductTable
npm run migration:run
```

**7. Bảo vệ route bằng guard:**
```typescript
@UseGuards(JwtAuthGuard)          // yêu cầu đăng nhập
@UseGuards(JwtAuthGuard, RolesGuard)  // yêu cầu đăng nhập + role
@Roles(Role.premium)
```

---

## Swagger UI

Truy cập `http://localhost:3000/api` khi chạy ở môi trường `development`.

- Click **Authorize** → nhập `Bearer <access_token>` để test các route cần auth
- Chỉ bật khi `NODE_ENV !== 'production'`

---

## Lưu ý khi dùng làm base

- Thay đổi `roles.enum.ts` nếu dự án có role khác (`admin`, `user`...)
- `tasks` module chỉ là ví dụ — xoá hoặc giữ lại tuỳ dự án
- Luôn chạy `migration:run` thay vì `schema:sync` từ staging trở lên
- Không commit file `.env` — đã có trong `.gitignore`
- Swagger chỉ bật ở `development` — xem `main.ts`
