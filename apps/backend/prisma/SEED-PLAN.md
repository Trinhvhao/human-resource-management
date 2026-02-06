# Seed Data Plan - HRM System

## 🎯 Mục tiêu
Tạo dữ liệu mẫu thực tế cho hệ thống HRM với cấu trúc tổ chức logic và hợp lý.

---

## 🏢 Cấu trúc tổ chức

### Cấp 1: Ban Giám Đốc (Root)
```
CEO Office (CEO)
├── Giám đốc điều hành (CEO)
└── Trợ lý giám đốc (2 người)
```

### Cấp 2: Các phòng ban chính (6 phòng)

#### 1. **Phòng Nhân sự (HR)** - 12 người
- **Trưởng phòng**: 1
- **Phó phòng**: 1
- **Nhân viên**:
  - Tuyển dụng: 3
  - Đào tạo: 2
  - Lương & Phúc lợi: 3
  - Hành chính: 2

#### 2. **Phòng Công nghệ (IT)** - 25 người
- **Trưởng phòng**: 1
- **Phó phòng**: 2
- **Team Backend**: 8 (1 Team Lead + 7 Dev)
- **Team Frontend**: 7 (1 Team Lead + 6 Dev)
- **Team DevOps**: 4 (1 Team Lead + 3 Engineer)
- **IT Support**: 3

#### 3. **Phòng Kinh doanh (Sales)** - 18 người
- **Trưởng phòng**: 1
- **Phó phòng**: 1
- **Team B2B**: 8 (1 Team Lead + 7 Sales)
- **Team B2C**: 5 (1 Team Lead + 4 Sales)
- **Customer Success**: 3

#### 4. **Phòng Marketing** - 10 người
- **Trưởng phòng**: 1
- **Phó phòng**: 1
- **Digital Marketing**: 3
- **Content**: 3
- **Design**: 2

#### 5. **Phòng Tài chính (Finance)** - 8 người
- **Trưởng phòng**: 1
- **Phó phòng**: 1
- **Kế toán**: 3
- **Kiểm soát ngân sách**: 2
- **Thuế & Báo cáo**: 1

#### 6. **Phòng Sản phẩm (Product)** - 15 người
- **Trưởng phòng**: 1
- **Phó phòng**: 1
- **Product Manager**: 4
- **UX/UI Designer**: 5
- **Product Analyst**: 4

### Cấp 3: Phòng ban con (Sub-departments)

#### IT → Backend Team
- Team Lead: 1
- Senior Dev: 3
- Mid Dev: 3
- Junior Dev: 1

#### IT → Frontend Team
- Team Lead: 1
- Senior Dev: 2
- Mid Dev: 3
- Junior Dev: 1

#### IT → DevOps Team
- Team Lead: 1
- Senior Engineer: 2
- Engineer: 1

#### Sales → B2B Team
- Team Lead: 1
- Senior Sales: 3
- Sales Executive: 4

#### Sales → B2C Team
- Team Lead: 1
- Senior Sales: 2
- Sales Executive: 2

---

## 👥 Tổng số nhân viên: ~91 người

### Phân bố theo cấp bậc:
- **C-Level**: 1 (CEO)
- **Trưởng phòng**: 6
- **Phó phòng**: 7
- **Team Lead**: 7
- **Senior**: 12
- **Mid-level**: 25
- **Junior/Staff**: 33

---

## 📋 Dữ liệu chi tiết cho mỗi nhân viên

### Thông tin cơ bản:
- `employeeCode`: Format "EMP{year}{month}{sequential}" (VD: EMP202401001)
- `fullName`: Tên tiếng Việt thực tế
- `dateOfBirth`: Tuổi từ 22-55
- `gender`: Nam/Nữ (phân bố cân bằng)
- `idCard`: 12 số ngẫu nhiên
- `phone`: 10 số (format 09xx, 08xx, 03xx)
- `email`: {firstname}.{lastname}@company.com
- `address`: Địa chỉ Hà Nội/HCM

### Thông tin công việc:
- `departmentId`: Link đến phòng ban
- `position`: Chức vụ cụ thể
- `startDate`: Từ 2020-2024 (phân bố đều)
- `status`: 
  - ACTIVE: 85%
  - ON_LEAVE: 10%
  - PROBATION: 5%

### Lương:
- **CEO**: 80,000,000 VND
- **Trưởng phòng**: 40,000,000 - 50,000,000 VND
- **Phó phòng**: 30,000,000 - 35,000,000 VND
- **Team Lead**: 25,000,000 - 30,000,000 VND
- **Senior**: 20,000,000 - 25,000,000 VND
- **Mid-level**: 12,000,000 - 18,000,000 VND
- **Junior/Staff**: 8,000,000 - 12,000,000 VND

---

## 🔐 Users & Roles

### Admin Users (5):
- CEO: admin@company.com (role: ADMIN)
- HR Manager: hr.manager@company.com (role: HR)
- IT Manager: it.manager@company.com (role: MANAGER)
- Finance Manager: finance.manager@company.com (role: MANAGER)
- Sales Manager: sales.manager@company.com (role: MANAGER)

### Employee Users (Random 20):
- Các nhân viên khác: {email} (role: EMPLOYEE)

**Password mặc định**: `Password123!`

---

## 📊 Dữ liệu bổ sung

### Contracts (100%):
- Mỗi nhân viên có 1 hợp đồng
- **Type**:
  - FULL_TIME: 80%
  - PART_TIME: 10%
  - CONTRACT: 10%
- **Status**: ACTIVE (match với employee status)

### Leave Balances (100%):
- Mỗi nhân viên có leave balance cho năm 2024, 2025
- **Annual Leave**: 12 ngày/năm
- **Sick Leave**: 30 ngày/năm
- **Used**: Random 0-8 ngày (annual), 0-5 ngày (sick)

### Attendance (Last 30 days):
- 90% nhân viên có attendance records
- **Present**: 85%
- **Late**: 10%
- **Absent**: 5%
- Check-in: 8:00-9:00
- Check-out: 17:00-18:30

### Leave Requests (Last 3 months):
- 40% nhân viên có ít nhất 1 leave request
- **Status**:
  - APPROVED: 70%
  - PENDING: 20%
  - REJECTED: 10%

### Overtime Requests (Last month):
- 30% nhân viên có overtime
- **Hours**: 2-8 giờ
- **Status**:
  - APPROVED: 80%
  - PENDING: 15%
  - REJECTED: 5%

### Payroll (Last 3 months):
- Tháng 11, 12/2024 và 01/2025
- **Status**:
  - Tháng 11, 12: FINALIZED
  - Tháng 01: DRAFT

### Rewards (Last 6 months):
- 20% nhân viên có reward
- **Amount**: 1,000,000 - 5,000,000 VND
- **Types**: PERFORMANCE, PROJECT_COMPLETION, INNOVATION

### Disciplines (Last 6 months):
- 5% nhân viên có discipline
- **Amount**: 500,000 - 2,000,000 VND
- **Types**: LATE, ABSENT, VIOLATION

---

## 🗂️ Thứ tự seed

1. **Departments** (Root → Level 2 → Level 3)
2. **Employees** (CEO → Managers → Staff)
3. **Users** (Admin + Selected employees)
4. **Update Department Managers** (Link manager to department)
5. **Contracts**
6. **Leave Balances**
7. **Attendance** (Last 30 days)
8. **Leave Requests** (Last 3 months)
9. **Overtime Requests** (Last month)
10. **Payroll & Payroll Items** (Last 3 months)
11. **Rewards** (Last 6 months)
12. **Disciplines** (Last 6 months)
13. **Holidays** (2024-2025)

---

## 🎲 Random Data Strategy

### Tên người Việt:
- **Họ**: Nguyễn, Trần, Lê, Phạm, Hoàng, Huỳnh, Phan, Vũ, Võ, Đặng, Bùi, Đỗ, Hồ, Ngô, Dương
- **Tên đệm**: Văn, Thị, Hữu, Đức, Minh, Anh, Thành, Quốc, Hồng, Thu
- **Tên**: An, Bình, Cường, Dũng, Hà, Hương, Linh, Mai, Nam, Phương, Quân, Tâm, Thảo, Tuấn, Vy

### Địa chỉ:
- **Hà Nội**: Cầu Giấy, Đống Đa, Hai Bà Trưng, Hoàn Kiếm, Thanh Xuân
- **HCM**: Quận 1, 3, 5, 7, Bình Thạnh, Phú Nhuận, Tân Bình

---

## ✅ Validation Rules

1. **Department hierarchy**: Không có circular reference
2. **Manager**: Phải thuộc department đó hoặc parent department
3. **Email**: Unique, format hợp lệ
4. **EmployeeCode**: Unique, format EMP + timestamp
5. **Salary**: Phù hợp với position level
6. **Dates**: Logic (startDate < endDate, dateOfBirth hợp lý)
7. **Leave balance**: usedAnnual ≤ annualLeave
8. **Attendance**: Không duplicate (employeeId + date)

---

**Created**: 2026-01-30
**Status**: Ready for implementation
