# Database Migrations - Hệ Thống Quản Lý Nhân Sự

## 📁 Cấu trúc thư mục

```
database/
├── migrations/
│   ├── 001_initial_schema.sql    # Schema chính (13 bảng)
│   ├── 002_seed_data.sql         # Dữ liệu mẫu
│   └── 999_rollback.sql          # Script xóa toàn bộ
└── README.md                      # File này
```

## 🚀 Cách sử dụng với Supabase

### Option 1: Sử dụng Supabase Dashboard (Khuyến nghị)

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** (biểu tượng database bên trái)
4. Tạo **New Query**
5. Copy nội dung file `001_initial_schema.sql` và paste vào
6. Click **Run** để thực thi
7. Lặp lại với file `002_seed_data.sql`

### Option 2: Sử dụng Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or run specific file
psql -h db.your-project.supabase.co -U postgres -d postgres -f database/migrations/001_initial_schema.sql
```

### Option 3: Sử dụng psql trực tiếp

```bash
# Connect to Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migration
\i database/migrations/001_initial_schema.sql
\i database/migrations/002_seed_data.sql
```

## 📊 Schema Overview

### 13 Bảng chính:

1. **users** - Tài khoản đăng nhập
2. **departments** - Phòng ban (hỗ trợ phân cấp)
3. **employees** - Nhân viên
4. **contracts** - Hợp đồng lao động
5. **attendances** - Chấm công
6. **leave_requests** - Đơn xin nghỉ
7. **payrolls** - Bảng lương tháng
8. **payroll_items** - Chi tiết lương
9. **rewards** - Khen thưởng
10. **disciplines** - Kỷ luật
11. **employee_history** - Audit trail
12. **chat_messages** - AI Chatbot
13. **audit_logs** - System logs

### Tính năng bổ sung:

- ✅ 40+ indexes cho performance
- ✅ 10 triggers tự động cập nhật `updated_at`
- ✅ 1 materialized view cho reports
- ✅ Helper functions (generate_employee_code)
- ✅ CHECK constraints cho data validation
- ✅ Foreign keys với ON DELETE rules

## 🧪 Dữ liệu mẫu (Seed Data)

File `002_seed_data.sql` tạo:

- 5 phòng ban (IT, HR, ACC, MKT, SALE)
- 10 nhân viên
- 11 tài khoản (1 admin, 3 managers, 7 employees)
- 6 hợp đồng
- ~250 bản ghi chấm công (10 ngày gần nhất)
- 3 đơn xin nghỉ
- 2 khen thưởng
- 1 kỷ luật
- 1 bảng lương tháng 12/2024

### Tài khoản mẫu:

| Email | Password | Role | Nhân viên |
|-------|----------|------|-----------|
| admin@company.com | Password@123 | ADMIN | - |
| ptd@company.com | Password@123 | HR_MANAGER | Phạm Thị Dung |
| nva@company.com | Password@123 | MANAGER | Nguyễn Văn An |
| bth@company.com | Password@123 | MANAGER | Bùi Thị Hoa |
| nvi@company.com | Password@123 | MANAGER | Ngô Văn Ích |
| ttb@company.com | Password@123 | EMPLOYEE | Trần Thị Bình |
| ... | ... | ... | ... |

⚠️ **Lưu ý**: Trong production, hãy thay đổi password và hash đúng cách với bcrypt!

## 🔄 Rollback

Nếu cần xóa toàn bộ schema và bắt đầu lại:

```sql
-- Run rollback script
\i database/migrations/999_rollback.sql

-- Then run initial schema again
\i database/migrations/001_initial_schema.sql
\i database/migrations/002_seed_data.sql
```

⚠️ **CẢNH BÁO**: Script rollback sẽ xóa TẤT CẢ dữ liệu! Chỉ dùng trong development.

## 📈 Materialized View

Hệ thống có 1 materialized view: `mv_employee_stats`

Để refresh (cập nhật dữ liệu):

```sql
REFRESH MATERIALIZED VIEW mv_employee_stats;
```

Nên refresh định kỳ hoặc sau khi có thay đổi lớn về nhân viên.

## 🔍 Kiểm tra sau khi migrate

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check row counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 🛠️ Troubleshooting

### Lỗi: "relation already exists"

```sql
-- Drop existing tables first
\i database/migrations/999_rollback.sql
```

### Lỗi: "permission denied"

Đảm bảo user có quyền CREATE:

```sql
GRANT CREATE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### Lỗi: "extension does not exist"

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 📚 Tài liệu tham khảo

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Proposal](../DATABASE_DESIGN_PROPOSAL.md)

## 🤝 Đóng góp

Nếu phát hiện lỗi hoặc có đề xuất cải tiến, vui lòng tạo issue hoặc pull request.

---

**Tạo bởi:** Kiro AI Assistant  
**Ngày:** 15/01/2026  
**Version:** 1.0
