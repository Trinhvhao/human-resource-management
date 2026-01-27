# ⚡ Quick Start - 5 phút setup

## Yêu cầu
- Node.js >= 18
- PostgreSQL >= 14
- Git

## Các bước

### 1️⃣ Clone & Install (2 phút)
```bash
git clone https://github.com/Trinhvhao/human-resource-management.git
cd human-resource-management

# Backend
cd apps/backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2️⃣ Database Setup (1 phút)
```bash
# Tạo database trong PostgreSQL
createdb hrms_db

# Hoặc dùng psql
psql -U postgres
CREATE DATABASE hrms_db;
\q
```

### 3️⃣ Config Environment (1 phút)
```bash
# Backend
cd apps/backend
cp .env.example .env
# Sửa DATABASE_URL trong .env

# Frontend
cd apps/frontend
cp .env.example .env.local
# Giữ nguyên NEXT_PUBLIC_API_URL=http://localhost:3333
```

### 4️⃣ Run Migrations & Seed (1 phút)
```bash
cd apps/backend

# Migrations
npx prisma generate
npx prisma migrate deploy

# Seed data (optional nhưng nên có)
node seed-contracts.js
node seed-additional-data.js
node apply-indexes.js
```

### 5️⃣ Start Servers (30 giây)
```bash
# Terminal 1 - Backend
cd apps/backend
npm run start:dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

## ✅ Done!

Mở trình duyệt: **http://localhost:3000**

**Login:**
- Email: `admin@2th.com`
- Password: `password123`

---

## 🆘 Gặp lỗi?

### Database connection failed
```bash
# Kiểm tra PostgreSQL đang chạy
pg_isready

# Kiểm tra DATABASE_URL trong apps/backend/.env
```

### Port already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Module not found
```bash
# Xóa và cài lại
rm -rf node_modules package-lock.json
npm install
```

---

**Chi tiết đầy đủ:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
