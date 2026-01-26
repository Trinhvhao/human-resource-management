# Hệ thống Quản lý Nhân sự (HRMS)

Hệ thống quản lý nhân sự hiện đại được xây dựng với Next.js 16, TypeScript và Tailwind CSS.

## Tính năng chính

- 👥 Quản lý nhân viên
- 📅 Quản lý chấm công
- 🏖️ Quản lý nghỉ phép
- ⏰ Quản lý làm thêm giờ
- 📊 Dashboard và báo cáo
- 📤 Xuất dữ liệu Excel
- 🔐 Xác thực và phân quyền

## Bắt đầu

### Cài đặt dependencies

```bash
npm install
```

### Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### Build production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Cấu trúc thư mục

```
apps/frontend/
├── app/              # Next.js App Router
├── components/       # React components
├── hooks/           # Custom hooks
├── lib/             # Libraries và utilities
├── services/        # API services
├── store/           # Zustand stores
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Environment Variables

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Hệ thống Quản lý Nhân sự
```

## Tài liệu

Xem thêm tài liệu chi tiết trong:
- [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) - Hướng dẫn setup
- [LANDING_PAGE_README.md](./LANDING_PAGE_README.md) - Thông tin landing page
- [DASHBOARD_README.md](./DASHBOARD_README.md) - Thông tin dashboard

## Pages

### Landing Page
- `/` - Trang chủ với hero, features, testimonials, FAQ

### Dashboard
- `/dashboard` - Tổng quan hệ thống
- `/dashboard/employees` - Quản lý nhân viên
- `/dashboard/departments` - Quản lý phòng ban
- `/dashboard/attendance` - Quản lý chấm công
- `/dashboard/leaves` - Quản lý nghỉ phép
- `/dashboard/overtime` - Quản lý làm thêm giờ
- `/dashboard/payroll` - Quản lý lương
- `/dashboard/settings` - Cài đặt hệ thống
