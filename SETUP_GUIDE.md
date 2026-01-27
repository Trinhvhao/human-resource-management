# Hướng dẫn Setup Dự án - Hệ thống Quản lý Nhân sự

## Yêu cầu hệ thống

- **Node.js**: >= 18.x
- **PostgreSQL**: >= 14.x
- **npm** hoặc **yarn**
- **Git**

## Bước 1: Clone Repository

```bash
git clone https://github.com/Trinhvhao/human-resource-management.git
cd human-resource-management
```

## Bước 2: Cài đặt Dependencies

### Backend
```bash
cd apps/backend
npm install
```

### Frontend
```bash
cd apps/frontend
npm install
```

## Bước 3: Setup Database

### 3.1. Tạo Database PostgreSQL

```bash
# Đăng nhập PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE hrms_db;

# Tạo user (optional)
CREATE USER hrms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hrms_db TO hrms_user;

# Thoát
\q
```

### 3.2. Cấu hình Environment Variables

#### Backend (.env)
```bash
cd apps/backend
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/hrms_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3333
NODE_ENV=development

# Email (optional - for notifications)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@hrms.com
```

#### Frontend (.env.local)
```bash
cd apps/frontend
cp .env.example .env.local
```

Chỉnh sửa file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## Bước 4: Chạy Database Migrations

```bash
cd apps/backend

# Generate Prisma Client
npx prisma generate

# Chạy migrations
npx prisma migrate deploy

# Hoặc nếu muốn reset database
npx prisma migrate reset
```

## Bước 5: Seed Database với Dữ liệu Mẫu

### 5.1. Seed Dữ liệu Cơ bản
```bash
cd apps/backend

# Tạo users, departments, employees cơ bản
node seed-database.js
```

### 5.2. Seed Hợp đồng
```bash
# Tạo 22 hợp đồng với các ngày hết hạn khác nhau
node seed-contracts.js
```

### 5.3. Seed Dữ liệu Bổ sung
```bash
# Tạo leave requests, overtime, rewards, disciplines
node seed-additional-data.js
```

### 5.4. Apply Database Indexes (Tối ưu hiệu suất)
```bash
# Tạo 38 indexes để tăng tốc queries
node apply-indexes.js
```

## Bước 6: Khởi động Ứng dụng

### Terminal 1 - Backend
```bash
cd apps/backend
npm run start:dev
```

Backend sẽ chạy tại: `http://localhost:3333`

### Terminal 2 - Frontend
```bash
cd apps/frontend
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Bước 7: Đăng nhập

Mở trình duyệt và truy cập: `http://localhost:3000`

### Tài khoản mặc định:

**Admin:**
- Email: `admin@2th.com`
- Password: `password123`

**HR Manager:**
- Email: `hr@2th.com`
- Password: `password123`

**Employee:**
- Email: `employee@2th.com`
- Password: `password123`

## Cấu trúc Dự án

```
human-resource-management/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/             # Source code
│   │   ├── prisma/          # Database schema & migrations
│   │   ├── seed-*.js        # Seed scripts
│   │   └── apply-indexes.js # Index optimization
│   │
│   └── frontend/            # Next.js App
│       ├── app/            # App Router pages
│       ├── components/     # React components
│       ├── services/       # API services
│       └── types/          # TypeScript types
│
├── database/               # SQL migrations (legacy)
├── docs/                  # Documentation
└── README.md
```

## Scripts Hữu ích

### Backend

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npx prisma studio              # GUI để xem database
npx prisma migrate dev         # Tạo migration mới
npx prisma migrate deploy      # Apply migrations
npx prisma generate           # Generate Prisma Client

# Seed data
node seed-contracts.js        # Seed hợp đồng
node seed-additional-data.js  # Seed dữ liệu bổ sung
node apply-indexes.js         # Apply indexes

# Testing
npm run test
npm run test:e2e
```

### Frontend

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

## Troubleshooting

### Lỗi: "Cannot connect to database"

**Giải pháp:**
1. Kiểm tra PostgreSQL đang chạy: `pg_isready`
2. Kiểm tra DATABASE_URL trong `.env`
3. Kiểm tra firewall/port 5432

### Lỗi: "Prisma Client not generated"

**Giải pháp:**
```bash
cd apps/backend
npx prisma generate
```

### Lỗi: "Port 3000 already in use"

**Giải pháp:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Lỗi: "Module not found"

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Database bị lỗi/muốn reset

**Giải pháp:**
```bash
cd apps/backend

# Reset database (XÓA TẤT CẢ DỮ LIỆU)
npx prisma migrate reset

# Seed lại
node seed-contracts.js
node seed-additional-data.js
node apply-indexes.js
```

## Tính năng Chính

### 1. Quản lý Nhân viên
- ✅ CRUD nhân viên
- ✅ Quản lý hợp đồng
- ✅ Lịch sử công việc
- ✅ Cấu trúc lương

### 2. Chấm công
- ✅ Check-in/Check-out
- ✅ Báo cáo chấm công
- ✅ Đi muộn/Về sớm
- ✅ Heatmap chấm công

### 3. Nghỉ phép
- ✅ Đăng ký nghỉ phép
- ✅ Duyệt/Từ chối đơn
- ✅ Quản lý số ngày phép
- ✅ Lịch sử nghỉ phép

### 4. Tăng ca
- ✅ Đăng ký tăng ca
- ✅ Duyệt/Từ chối đơn
- ✅ Tính lương tăng ca
- ✅ Báo cáo tăng ca

### 5. Lương
- ✅ Tạo bảng lương
- ✅ Tính lương tự động
- ✅ Phụ cấp/Thưởng/Khấu trừ
- ✅ Xuất báo cáo

### 6. Khen thưởng & Kỷ luật
- ✅ Quản lý khen thưởng
- ✅ Quản lý kỷ luật
- ✅ Lịch sử

### 7. Dashboard
- ✅ Tổng quan hệ thống
- ✅ Biểu đồ thống kê
- ✅ Hợp đồng sắp hết hạn
- ✅ Cảnh báo quan trọng

## Performance

Hệ thống đã được tối ưu với:
- ✅ 38 database indexes
- ✅ Query optimization
- ✅ Caching strategies
- ✅ Lazy loading
- ✅ Code splitting

**Kết quả:**
- Dashboard load: ~5ms
- Employee list: ~3ms
- Attendance reports: ~8ms
- 100x faster than before!

## Security

- ✅ JWT Authentication
- ✅ Role-based Access Control (RBAC)
- ✅ Password hashing (bcrypt)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ CORS configuration

## API Documentation

API docs có sẵn tại: `http://localhost:3333/api`

Hoặc xem file: `apps/backend/docs/API.md`

## Database Schema

Xem schema chi tiết tại: `apps/backend/prisma/schema.prisma`

Hoặc mở Prisma Studio:
```bash
cd apps/backend
npx prisma studio
```

## Deployment

### Backend (Railway/Heroku/VPS)

1. Set environment variables
2. Run migrations: `npx prisma migrate deploy`
3. Build: `npm run build`
4. Start: `npm run start:prod`

### Frontend (Vercel/Netlify)

1. Set NEXT_PUBLIC_API_URL
2. Build: `npm run build`
3. Deploy

## Support

Nếu gặp vấn đề:
1. Kiểm tra [Issues](https://github.com/Trinhvhao/human-resource-management/issues)
2. Đọc [Documentation](./docs/)
3. Tạo issue mới

## License

MIT License

## Contributors

- Trịnh Văn Hào - [GitHub](https://github.com/Trinhvhao)

---

**Chúc bạn setup thành công! 🎉**
