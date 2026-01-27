# 🏢 Human Resource Management System (HRMS)

Hệ thống quản lý nhân sự toàn diện với đầy đủ tính năng cho doanh nghiệp vừa và nhỏ.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)](https://www.postgresql.org/)

---

## ✨ Tính năng chính

### 🔐 Module 1-9: Đã hoàn thành
- ✅ Authentication & Authorization
- ✅ Employee Management  
- ✅ Department Management
- ✅ Attendance Management
- ✅ Leave Management
- ✅ Overtime Management
- ✅ Payroll Management
- ✅ Salary Components
- ✅ Rewards & Disciplines

---

## 🛠️ Tech Stack

**Backend:** NestJS + Prisma + PostgreSQL (Supabase)  
**Frontend:** Next.js 16 + TypeScript + TailwindCSS  
**Database:** 20 tables, 85+ API endpoints

---

## 🚀 Quick Start

**📋 Chi tiết đầy đủ:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)

```bash
# 1. Clone repository
git clone https://github.com/Trinhvhao/human-resource-management.git
cd human-resource-management

# 2. Setup Backend
cd apps/backend
npm install
cp .env.example .env
# Chỉnh sửa .env với DATABASE_URL của bạn

# 3. Database setup
npx prisma generate
npx prisma migrate deploy

# 4. Seed data (optional)
node seed-contracts.js
node seed-additional-data.js
node apply-indexes.js

# 5. Start backend
npm run start:dev

# 6. Setup Frontend (terminal mới)
cd apps/frontend
npm install
cp .env.example .env.local
# Chỉnh sửa NEXT_PUBLIC_API_URL=http://localhost:3333

# 7. Start frontend
npm run dev
```

**Access:** http://localhost:3000

---

## 🔑 Default Accounts

- **Admin:** `admin@2th.com` / `password123`
- **HR Manager:** `hr@2th.com` / `password123`
- **Employee:** `employee@2th.com` / `password123`

---

## 📖 Documentation

- [📋 Setup Guide](./SETUP_GUIDE.md) - **BẮT ĐẦU TẠI ĐÂY**
- [📘 Full Documentation](./PROJECT_DOCUMENTATION.md)
- [🗄️ Database Indexes Guide](./apps/backend/DATABASE_INDEXES_GUIDE.md)
- [🚀 Deployment Guide](./DEPLOYMENT_GUIDE.md)

---

**Made with ❤️ in Vietnam**
