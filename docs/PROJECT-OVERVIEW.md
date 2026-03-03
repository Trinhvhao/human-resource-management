# 🏢 Hệ thống Quản lý Nhân sự (HRMS)

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 27/02/2026

---

## 📋 Tổng quan

Hệ thống quản lý nhân sự toàn diện cho doanh nghiệp, bao gồm quản lý nhân viên, chấm công, nghỉ phép, hợp đồng, lương và các chức năng HR khác.

---

## 🏗️ Kiến trúc

### Backend
- **Framework:** NestJS + TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Authentication:** JWT
- **Storage:** Supabase Storage
- **Email:** Nodemailer

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI:** React + TypeScript + Tailwind CSS
- **State Management:** Zustand
- **Animation:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 📦 Modules chính

### 1. 👤 Quản lý Nhân viên
- Danh sách nhân viên (Table/Card/Grid view)
- Hồ sơ chi tiết (Profile, Documents, Salary, Rewards/Disciplines, Activity)
- Thêm/Sửa/Xóa nhân viên
- Upload avatar & documents
- Profile completion tracking
- Activity timeline

### 2. 🏢 Quản lý Phòng ban
- Danh sách phòng ban
- Cây tổ chức (Organization chart)
- Yêu cầu thay đổi phòng ban (workflow)
- Performance dashboard
- Department statistics

### 3. 📝 Quản lý Hợp đồng
- Danh sách hợp đồng
- Tạo/Gia hạn hợp đồng
- Chấm dứt hợp đồng (workflow)
- Cảnh báo hết hạn
- Contract compliance

### 4. ⏰ Chấm công
- Tổng quan chấm công
- Lịch sử chấm công
- Yêu cầu sửa chấm công
- Báo cáo chấm công
- Quản lý ca làm việc
- Live feed & trends

### 5. 🌴 Nghỉ phép
- Danh sách yêu cầu nghỉ phép
- Số dư phép (Leave balances)
- Workflow phê duyệt
- Email notifications

### 6. 📋 Làm thêm giờ
- Đăng ký làm thêm giờ
- Workflow phê duyệt
- Tính vào lương (x1.5)

### 7. 💰 Quản lý Lương
- Bảng lương (Payroll runs)
- Workflow phê duyệt (Draft → Pending → Approved → Locked)
- Cấu trúc lương (Salary components)
- Tính toán tự động:
  - Lương cơ bản + Phụ cấp
  - Bảo hiểm (10.5%)
  - Thuế TNCN (5-35% lũy tiến)
  - Thưởng/Phạt
  - Làm thêm giờ (x1.5)
- Phiếu lương cá nhân
- Báo cáo YTD (Year-to-date)

### 8. 🏆 Thưởng & Phạt
- Quản lý khen thưởng
- Quản lý kỷ luật
- Tổng hợp thưởng/phạt
- Tự động tính vào lương
- Hiển thị trong hồ sơ nhân viên

### 9. 📊 Dashboard
- Tổng quan hệ thống
- Thống kê nhân sự
- Chấm công hôm nay
- Cảnh báo quan trọng
- Charts & trends

---

## 🔐 Phân quyền

### ADMIN
- Toàn quyền truy cập
- Quản lý users
- Cấu hình hệ thống

### HR_MANAGER
- Quản lý nhân viên
- Quản lý lương
- Phê duyệt nghỉ phép/OT
- Xem báo cáo

### MANAGER
- Xem nhân viên trong phòng ban
- Phê duyệt nghỉ phép/OT của team
- Xem báo cáo phòng ban

### EMPLOYEE
- Xem thông tin cá nhân
- Chấm công
- Đăng ký nghỉ phép/OT
- Xem phiếu lương

---

## 🚀 Cài đặt & Chạy

### Backend
```bash
cd apps/backend
npm install
npx prisma generate
npm run start:dev
```

### Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

### Database
```bash
# Chạy migrations trên Supabase Dashboard
# Hoặc local:
npx prisma migrate dev
```

---

## 🌐 URLs

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3333
- **API Docs:** http://localhost:3333/api

---

## 📁 Cấu trúc thư mục

```
QLNS/
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── employees/
│   │   │   ├── departments/
│   │   │   ├── contracts/
│   │   │   ├── attendances/
│   │   │   ├── leaves/
│   │   │   ├── overtime/
│   │   │   ├── payrolls/
│   │   │   ├── rewards/
│   │   │   ├── disciplines/
│   │   │   ├── salary-components/
│   │   │   └── ...
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   │
│   └── frontend/         # Next.js App
│       ├── app/
│       │   └── dashboard/
│       │       ├── employees/
│       │       ├── departments/
│       │       ├── contracts/
│       │       ├── attendance/
│       │       ├── leaves/
│       │       ├── overtime/
│       │       ├── payroll/
│       │       ├── rewards/
│       │       ├── disciplines/
│       │       └── rewards-disciplines/
│       ├── components/
│       ├── services/
│       └── types/
│
└── docs/                 # Documentation
    ├── README.md
    └── PROJECT-OVERVIEW.md
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_STORAGE_BUCKET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

---

## 📊 Database Schema

### Core Tables
- **User** - Tài khoản đăng nhập
- **Employee** - Thông tin nhân viên
- **EmployeeProfile** - Hồ sơ chi tiết
- **EmployeeDocument** - Tài liệu
- **EmployeeActivity** - Lịch sử hoạt động
- **Department** - Phòng ban
- **Contract** - Hợp đồng
- **Attendance** - Chấm công
- **LeaveRequest** - Nghỉ phép
- **OvertimeRequest** - Làm thêm giờ
- **Payroll** - Bảng lương
- **PayrollItem** - Chi tiết lương
- **SalaryComponent** - Cấu trúc lương
- **Reward** - Khen thưởng
- **Discipline** - Kỷ luật

---

## 🎯 Tính năng nổi bật

### 1. Workflow phê duyệt
- Nghỉ phép: PENDING → APPROVED/REJECTED
- Làm thêm giờ: PENDING → APPROVED/REJECTED
- Chấm công sửa: PENDING → APPROVED/REJECTED
- Chấm dứt HĐ: PENDING → APPROVED/REJECTED
- Lương: DRAFT → PENDING → APPROVED → LOCKED

### 2. Tính toán lương tự động
- Lương theo ngày công thực tế
- Bảo hiểm 10.5% (cap 36M)
- Thuế TNCN lũy tiến (5-35%)
- Thưởng/Phạt theo tháng
- Làm thêm giờ x1.5

### 3. Email notifications
- Phê duyệt nghỉ phép
- Phê duyệt làm thêm giờ
- Xác thực email
- Cảnh báo hợp đồng hết hạn

### 4. Upload & Storage
- Avatar nhân viên
- Documents (CMND, Bằng cấp, Hợp đồng...)
- Supabase Storage integration

### 5. Activity Timeline
- Theo dõi mọi thay đổi
- Ai làm gì, khi nào
- Audit trail đầy đủ

---

## 🐛 Known Issues

Không có issues quan trọng. Hệ thống đang hoạt động ổn định.

---

## 📈 Roadmap

### Phase 1: Core Features ✅
- Quản lý nhân viên
- Chấm công cơ bản
- Nghỉ phép
- Hợp đồng

### Phase 2: Advanced Features ✅
- Làm thêm giờ
- Lương & Workflow
- Thưởng & Phạt
- Email notifications

### Phase 3: Enhancements (Đang thực hiện)
- Performance optimization
- Advanced reporting
- Mobile responsive
- Export Excel/PDF

### Phase 4: Future
- Mobile app
- Biometric attendance
- AI-powered insights
- Multi-language support

---

## 👥 Team

- **Developer:** Kiro AI
- **Project Type:** Enterprise HRMS
- **Tech Stack:** NestJS + Next.js + PostgreSQL

---

## 📞 Support

Để được hỗ trợ, vui lòng tạo issue trên repository hoặc liên hệ team phát triển.

---

**Last Updated:** 27/02/2026  
**Version:** 1.0.0
