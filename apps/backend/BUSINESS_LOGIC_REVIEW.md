# 🔍 ĐÁNH GIÁ LOGIC NGHIỆP VỤ - HỆ THỐNG QUẢN LÝ NHÂN SỰ

**Ngày đánh giá:** 21/01/2026  
**Người đánh giá:** Kiro AI  
**Mục đích:** Kiểm tra công tâm các vấn đề logic nghiệp vụ cơ bản

---

## ✅ ĐIỂM MẠNH

### 1. Employees Module
- ✅ Validation email và ID card uniqueness
- ✅ Soft delete (TERMINATED status) thay vì hard delete
- ✅ Auto-generate employee code (EMP26001, EMP26002...)
- ✅ Employee history tracking cho các thay đổi quan trọng
- ✅ Deactivate user account khi terminate employee
- ✅ Department validation trước khi assign

### 2. Attendances Module
- ✅ Check-in/Check-out logic rõ ràng
- ✅ Late detection (15 phút grace period)
- ✅ Early leave detection
- ✅ Work hours calculation tự động
- ✅ Prevent duplicate check-in/check-out trong ngày
- ✅ Monthly summary với statistics

### 3. Leave Requests Module
- ✅ Calculate work days (exclude weekends & holidays)
- ✅ Check leave balance trước khi approve
- ✅ Auto deduct from balance khi approve
- ✅ Create attendance records cho leave days
- ✅ Email notifications (approved/rejected)
- ✅ Only owner can cancel pending requests

### 4. Payrolls Module
- ✅ Progressive tax calculation (7 brackets)
- ✅ Insurance deduction (10.5%)
- ✅ Personal deduction (11M VND)
- ✅ Overtime pay integration (150% rate)
- ✅ Pro-rated salary based on actual work days
- ✅ Rewards and disciplines integration
- ✅ Cannot update finalized payroll

---

## ⚠️ VẤN ĐỀ CẦN XEM XÉT

### 1. Employees Module

#### 🔴 CRITICAL: Thiếu validation ngày sinh
```typescript
// Hiện tại không check tuổi tối thiểu
dateOfBirth: new Date(dto.dateOfBirth)
```
**Vấn đề:** Có thể tạo nhân viên với tuổi < 18 (vi phạm luật lao động VN)

**Giải pháp:**
```typescript
const age = (new Date().getFullYear() - new Date(dto.dateOfBirth).getFullYear());
if (age < 18) {
  throw new BadRequestException('Employee must be at least 18 years old');
}
```

#### 🟡 MEDIUM: Thiếu validation startDate
```typescript
startDate: new Date(dto.startDate)
```
**Vấn đề:** Có thể tạo nhân viên với startDate trong quá khứ xa hoặc tương lai xa

**Giải pháp:** Validate startDate trong khoảng hợp lý (ví dụ: không quá 1 năm trong quá khứ)

#### 🟡 MEDIUM: Soft delete không xóa dữ liệu nhạy cảm
```typescript
// Chỉ set status = TERMINATED
status: 'TERMINATED'
```
**Vấn đề:** Email, phone, idCard vẫn còn trong DB, có thể conflict khi re-hire

**Giải pháp:** Anonymize hoặc suffix email/phone khi terminate

---

### 2. Attendances Module

#### 🔴 CRITICAL: Thiếu validation check-in trong quá khứ
```typescript
// Không check date
const today = new Date();
today.setHours(0, 0, 0, 0);
```
**Vấn đề:** HR có thể tạo attendance thủ công cho ngày trong quá khứ mà không có giới hạn

**Giải pháp:** Thêm endpoint riêng cho manual attendance với validation date range

#### 🟡 MEDIUM: Work hours calculation không chính xác
```typescript
const workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
```
**Vấn đề:** Không trừ giờ nghỉ trưa (12:00-13:00)

**Giải pháp:** 
```typescript
// Trừ 1 giờ nghỉ trưa nếu làm việc > 4 giờ
if (workHours > 4) {
  workHours -= 1; // Lunch break
}
```

#### 🟡 MEDIUM: Thiếu validation check-out trước check-in
```typescript
// Không check thứ tự thời gian
checkOut: now
```
**Vấn đề:** Có thể check-out trước check-in nếu sửa dữ liệu thủ công

---

### 3. Leave Requests Module

#### 🔴 CRITICAL: Không check overlap leave requests
```typescript
// Không check xem đã có leave request nào trong khoảng thời gian này chưa
const leaveRequest = await this.prisma.leaveRequest.create({...})
```
**Vấn đề:** Có thể tạo nhiều leave requests cho cùng một khoảng thời gian

**Giải pháp:**
```typescript
const overlapping = await this.prisma.leaveRequest.findFirst({
  where: {
    employeeId,
    status: { in: ['PENDING', 'APPROVED'] },
    OR: [
      { startDate: { lte: endDate }, endDate: { gte: startDate } }
    ]
  }
});
if (overlapping) {
  throw new BadRequestException('Leave request overlaps with existing request');
}
```

#### 🟡 MEDIUM: Không check minimum notice period
```typescript
// Không check thời gian đăng ký trước
const startDate = new Date(dto.startDate);
```
**Vấn đề:** Nhân viên có thể đăng ký nghỉ phép vào ngày hôm nay hoặc ngày mai

**Giải pháp:** Require ít nhất 3 ngày notice (trừ sick leave)

#### 🟡 MEDIUM: Không check maximum consecutive days
**Vấn đề:** Nhân viên có thể nghỉ 30 ngày liên tục nếu có đủ balance

**Giải pháp:** Limit maximum 14 ngày liên tục (trừ maternity leave)

---

### 4. Payrolls Module

#### 🔴 CRITICAL: Không tích hợp Salary Components
```typescript
const baseSalary = Number(employee.baseSalary);
```
**Vấn đề:** Đã có module Salary Components nhưng không sử dụng trong tính lương

**Giải pháp:**
```typescript
// Get total salary from salary components
const salaryComponents = await this.salaryComponentsService.findByEmployee(employeeId);
const baseSalary = salaryComponents.totalSalary;
```

#### 🟡 MEDIUM: Insurance rate cố định
```typescript
private readonly INSURANCE_RATE = 0.105; // 10.5%
```
**Vấn đề:** Insurance rate thực tế phụ thuộc vào mức lương (có cap)

**Giải pháp:** 
```typescript
// BHXH cap at 36M VND (2024)
const insuranceBase = Math.min(grossSalary, 36000000);
const insurance = insuranceBase * 0.105;
```

#### 🟡 MEDIUM: Không tính phụ cấp cố định
```typescript
allowances: 0, // Hardcoded to 0
```
**Vấn đề:** Không tính các phụ cấp như ăn trưa, xăng xe (đã có trong Salary Components)

**Giải pháp:** Integrate với Salary Components để lấy allowances

#### 🟢 LOW: Personal deduction cố định
```typescript
private readonly PERSONAL_DEDUCTION = 11000000; // 11M VND
```
**Vấn đề:** Không tính người phụ thuộc (4.4M/người)

**Giải pháp:** Thêm module Dependents và tính deduction động

---

### 5. Overtime Module

#### 🟡 MEDIUM: Không check maximum overtime hours
```typescript
// Không giới hạn số giờ tăng ca
hours: dto.hours
```
**Vấn đề:** Luật lao động VN giới hạn 200 giờ/năm, 30 giờ/tháng

**Giải pháp:**
```typescript
const monthlyTotal = await this.getMonthlyOvertimeHours(employeeId, month, year);
if (monthlyTotal + dto.hours > 30) {
  throw new BadRequestException('Exceeded monthly overtime limit (30 hours)');
}
```

#### 🟡 MEDIUM: Không check overtime time range
```typescript
// Không check giờ tăng ca hợp lệ
startTime: dto.startTime,
endTime: dto.endTime
```
**Vấn đề:** Có thể đăng ký tăng ca trong giờ hành chính (8:30-17:30)

**Giải pháp:** Validate overtime phải ngoài giờ làm việc

---

### 6. Attendance Corrections Module

#### 🟡 MEDIUM: Không check correction limit
```typescript
// Không giới hạn số lần điều chỉnh
const correction = await this.prisma.attendanceCorrection.create({...})
```
**Vấn đề:** Nhân viên có thể tạo nhiều correction requests cho cùng một ngày

**Giải pháp:** Limit 1 pending correction per date per employee

---

### 7. Contracts Module

#### 🟡 MEDIUM: Không auto-expire contracts
**Vấn đề:** Hợp đồng hết hạn nhưng status vẫn là ACTIVE

**Giải pháp:** Thêm cron job để auto-expire contracts:
```typescript
@Cron('0 0 * * *') // Daily at midnight
async checkExpiredContracts() {
  await this.prisma.contract.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: new Date() }
    },
    data: { status: 'EXPIRED' }
  });
}
```

#### 🟡 MEDIUM: Không check contract overlap
**Vấn đề:** Một nhân viên có thể có nhiều ACTIVE contracts cùng lúc

**Giải pháp:** Validate không có contract overlap khi tạo mới

---

## 📊 TỔNG KẾT VẤN ĐỀ

### Theo mức độ nghiêm trọng:
- 🔴 **CRITICAL (4 vấn đề):**
  1. Employees: Thiếu validation tuổi tối thiểu
  2. Attendances: Thiếu validation check-in quá khứ
  3. Leave Requests: Không check overlap requests
  4. Payrolls: Không tích hợp Salary Components

- 🟡 **MEDIUM (12 vấn đề):**
  1. Employees: Thiếu validation startDate
  2. Employees: Soft delete không anonymize
  3. Attendances: Work hours không trừ lunch break
  4. Attendances: Thiếu validation check-out time
  5. Leave Requests: Không check notice period
  6. Leave Requests: Không check max consecutive days
  7. Payrolls: Insurance rate không có cap
  8. Payrolls: Không tính allowances
  9. Overtime: Không check max hours
  10. Overtime: Không validate time range
  11. Attendance Corrections: Không limit corrections
  12. Contracts: Không auto-expire

- 🟢 **LOW (1 vấn đề):**
  1. Payrolls: Personal deduction không tính dependents

---

## 🎯 ƯU TIÊN KHẮC PHỤC

### Tuần này (CRITICAL):
1. ✅ **Payrolls: Tích hợp Salary Components** (đã có module)
2. ⏸️ Leave Requests: Check overlap requests
3. ⏸️ Employees: Validation tuổi tối thiểu
4. ⏸️ Attendances: Tách manual attendance endpoint

### Tuần sau (MEDIUM - High Priority):
1. ⏸️ Attendances: Trừ lunch break trong work hours
2. ⏸️ Payrolls: Insurance cap at 36M
3. ⏸️ Overtime: Check maximum hours
4. ⏸️ Contracts: Auto-expire cron job

### Có thể hoãn (MEDIUM - Low Priority):
1. ⏸️ Leave Requests: Notice period & max days
2. ⏸️ Employees: Anonymize on terminate
3. ⏸️ Overtime: Validate time range
4. ⏸️ Attendance Corrections: Limit corrections

### Optional (LOW):
1. ⏸️ Payrolls: Dependents module

---

## 💡 KHUYẾN NGHỊ

### 1. Testing
- Thêm unit tests cho các business logic calculations
- Thêm integration tests cho workflows (create → approve → update)
- Test edge cases (boundary values, invalid data)

### 2. Documentation
- Document business rules trong code comments
- Tạo API documentation với examples
- Document validation rules cho frontend

### 3. Code Quality
- Thêm constants file cho magic numbers
- Extract calculation logic thành helper functions
- Add TypeScript strict mode

### 4. Security
- Add rate limiting cho sensitive endpoints
- Log all approval/rejection actions
- Add audit trail cho payroll changes

---

## 📝 KẾT LUẬN

**Đánh giá tổng thể:** 7.5/10

**Điểm mạnh:**
- Logic nghiệp vụ cơ bản đã đầy đủ
- Validation cơ bản đã có
- Integration giữa các modules tốt
- Email notifications hoạt động

**Điểm yếu:**
- Thiếu một số validation quan trọng (overlap, limits)
- Chưa tích hợp hết các modules (Salary Components)
- Một số calculation chưa chính xác (insurance cap, lunch break)
- Thiếu cron jobs cho auto-tasks

**Khả năng demo:** ✅ SẴN SÀNG (với 4 critical fixes)

**Khả năng production:** ⚠️ CẦN KHẮC PHỤC (ít nhất 8 medium issues)

---

**Người đánh giá:** Kiro AI  
**Ngày:** 21/01/2026  
**Version:** 1.0
