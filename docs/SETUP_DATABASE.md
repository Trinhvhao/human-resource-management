# 🚀 HƯỚNG DẪN SETUP DATABASE

## 📋 Thông tin kết nối Supabase

```
Project: odqfsgobncdolqbtumfd
Region: ap-southeast-2 (Sydney)
Pooler URL: postgresql://postgres.odqfsgobncdolqbtumfd:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
Direct URL: postgresql://postgres.odqfsgobncdolqbtumfd:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

## 🔧 BƯỚC 1: Cấu hình Backend

### 1.1. Cập nhật file `.env`

```bash
cd apps/backend
```

Mở file `.env` và thay `[YOUR-PASSWORD]` bằng password thật của bạn:

```env
DATABASE_URL="postgresql://postgres.odqfsgobncdolqbtumfd:YOUR_REAL_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.odqfsgobncdolqbtumfd:YOUR_REAL_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"
```

### 1.2. Lấy Supabase Keys

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy các keys:
   - `anon` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

Cập nhật vào file `.env`:

```env
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📊 BƯỚC 2: Chạy Migrations

### Option 1: Sử dụng Supabase Dashboard (Khuyến nghị)

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Tạo **New Query**
5. Copy nội dung file `database/migrations/001_initial_schema.sql`
6. Paste vào và click **Run**
7. Đợi ~10 giây để hoàn thành
8. Lặp lại với file `database/migrations/002_seed_data.sql`

### Option 2: Sử dụng psql (Command line)

```bash
# Cài đặt psql nếu chưa có
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Connect và chạy migrations
psql "postgresql://postgres.odqfsgobncdolqbtumfd:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f database/migrations/001_initial_schema.sql

psql "postgresql://postgres.odqfsgobncdolqbtumfd:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f database/migrations/002_seed_data.sql
```

## 🔍 BƯỚC 3: Kiểm tra Database

### 3.1. Kiểm tra tables

Vào **SQL Editor** và chạy:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Kết quả phải có 13 bảng:
- attendances
- audit_logs
- chat_messages
- contracts
- departments
- disciplines
- employee_history
- employees
- leave_requests
- payroll_items
- payrolls
- rewards
- users

### 3.2. Kiểm tra dữ liệu mẫu

```sql
-- Check departments
SELECT code, name FROM departments;

-- Check employees
SELECT employee_code, full_name, position FROM employees;

-- Check users
SELECT email, role FROM users;
```

## 🔐 BƯỚC 4: Test Login

Tài khoản mẫu để test:

| Email | Password | Role |
|-------|----------|------|
| admin@company.com | Password@123 | ADMIN |
| ptd@company.com | Password@123 | HR_MANAGER |
| nva@company.com | Password@123 | MANAGER |

⚠️ **Lưu ý**: Password hash trong seed data là mẫu. Trong production cần hash đúng với bcrypt!

## 🛠️ BƯỚC 5: Setup Prisma (Backend)

```bash
cd apps/backend

# Install Prisma
pnpm add -D prisma
pnpm add @prisma/client

# Generate Prisma Client
npx prisma generate

# (Optional) Prisma Studio để xem database
npx prisma studio
```

## 🚨 Troubleshooting

### Lỗi: "password authentication failed"

→ Kiểm tra lại password trong file `.env`

### Lỗi: "relation already exists"

→ Chạy rollback trước:

```sql
-- Copy nội dung file database/migrations/999_rollback.sql và chạy
```

### Lỗi: "permission denied"

→ Đảm bảo user có quyền CREATE:

```sql
GRANT CREATE ON SCHEMA public TO postgres;
```

### Lỗi: "could not connect to server"

→ Kiểm tra:
1. Internet connection
2. Firewall không block port 5432/6543
3. Supabase project đang active

## 📚 Tài liệu tham khảo

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Database](https://docs.nestjs.com/techniques/database)

## ✅ Checklist

- [ ] Cập nhật password trong `.env`
- [ ] Lấy và cập nhật Supabase keys
- [ ] Chạy migration `001_initial_schema.sql`
- [ ] Chạy migration `002_seed_data.sql`
- [ ] Kiểm tra 13 bảng đã tạo
- [ ] Kiểm tra dữ liệu mẫu
- [ ] Test login với tài khoản admin
- [ ] Generate Prisma Client
- [ ] Chạy thử backend: `pnpm backend:dev`

---

**Tạo bởi:** Kiro AI Assistant  
**Ngày:** 15/01/2026
