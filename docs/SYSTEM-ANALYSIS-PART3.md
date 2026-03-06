# HỆ THỐNG QUẢN LÝ NHÂN SỰ - PHẦN 3

## PHẦN 3: MODULE LƯƠNG & THƯỞNG PHẠT (3 MODULE)

### 7. MODULE LƯƠNG (PAYROLL & SALARY COMPONENTS)

#### 7.1. Mô tả chức năng
Module quản lý lương toàn diện với các tính năng:
- Tính lương tự động hàng tháng
- Quản lý cấu trúc lương linh hoạt (salary components)
- Workflow phê duyệt lương (Draft → Pending → Approved → Locked)
- Tính thuế thu nhập cá nhân (PIT) theo luật VN
- Tính bảo hiểm (BHXH, BHYT, BHTN)
- Tích hợp overtime, rewards, disciplines
- Payslip cho nhân viên
- Versioning và revision

#### 7.2. Database Models

**Payroll Model** (`payrolls` table):
```prisma
- id: UUID (primary key)
- month: Int - Tháng (1-12)
- year: Int - Năm
- status: Enum - Trạng thái
  * DRAFT: Nháp, đang tính toán
  * PENDING_APPROVAL: Chờ phê duyệt
  * APPROVED: Đã duyệt, sẵn sàng thanh toán
  * REJECTED: Bị từ chối
  * LOCKED: Đã khóa sau khi thanh toán
- totalAmount: Decimal - Tổng tiền lương
- finalizedAt: DateTime (nullable) - Thời điểm finalize
- finalizedBy: UUID (nullable) - Người finalize
- approvedBy: UUID (nullable) - Người phê duyệt
- approvedAt: DateTime (nullable)
- rejectedBy: UUID (nullable) - Người từ chối
- rejectedAt: DateTime (nullable)
- rejectionReason: String (nullable)
- lockedAt: DateTime (nullable) - Thời điểm khóa
- lockedBy: UUID (nullable)
- version: Int - Phiên bản (default: 1)
- previousVersionId: UUID (nullable) - Link đến version trước
- submittedAt: DateTime (nullable)
- submittedBy: UUID (nullable)
- notes: String (nullable)
- createdAt, updatedAt: DateTime

Unique constraint: [month, year]
```

**PayrollItem Model** (`payroll_items` table):
```prisma
- id: UUID
- payrollId: UUID - Bảng lương
- employeeId: UUID - Nhân viên
- baseSalary: Decimal - Lương cơ bản
- workDays: Int - Số ngày làm việc trong tháng
- actualWorkDays: Decimal - Số ngày thực tế làm
- allowances: Decimal - Phụ cấp (default: 0)
- bonus: Decimal - Thưởng (default: 0)
- deduction: Decimal - Khấu trừ (default: 0)
- overtimeHours: Decimal - Số giờ OT (default: 0)
- overtimePay: Decimal - Tiền OT (default: 0)
- insurance: Decimal - Bảo hiểm (default: 0)
- tax: Decimal - Thuế TNCN (default: 0)
- netSalary: Decimal - Lương thực nhận
- notes: String (nullable)
- createdAt, updatedAt: DateTime

Unique constraint: [payrollId, employeeId]
```

**SalaryComponent Model** (`salary_components` table):
```prisma
- id: UUID
- employeeId: UUID - Nhân viên
- componentType: String - Loại thành phần lương
  * ALLOWANCE_HOUSING: Phụ cấp nhà ở
  * ALLOWANCE_TRANSPORT: Phụ cấp đi lại
  * ALLOWANCE_MEAL: Phụ cấp ăn trưa
  * ALLOWANCE_PHONE: Phụ cấp điện thoại
  * ALLOWANCE_POSITION: Phụ cấp chức vụ
  * ALLOWANCE_RESPONSIBILITY: Phụ cấp trách nhiệm
  * ALLOWANCE_HAZARD: Phụ cấp độc hại
  * ALLOWANCE_OTHER: Phụ cấp khác
  * BONUS_PERFORMANCE: Thưởng hiệu suất
  * BONUS_PROJECT: Thưởng dự án
  * BONUS_HOLIDAY: Thưởng lễ tết
  * DEDUCTION_ADVANCE: Khấu trừ tạm ứng
  * DEDUCTION_LOAN: Khấu trừ vay
  * DEDUCTION_OTHER: Khấu trừ khác
- amount: Decimal - Số tiền
- effectiveDate: Date - Ngày hiệu lực
- isActive: Boolean - Đang áp dụng (default: true)
- note: String (nullable)
- createdAt, updatedAt: DateTime
```

#### 7.3. Backend Endpoints

**Payrolls Controller** (`/api/payrolls`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/payrolls` | Danh sách bảng lương | Query: `year, status` | `{ payrolls[] }` |
| GET | `/payrolls/:id` | Chi tiết bảng lương | - | `{ payroll, items[] }` |
| GET | `/payrolls/payslip/:employeeId/:month/:year` | Phiếu lương nhân viên | - | `{ payslip }` |
| POST | `/payrolls` | Tạo bảng lương tháng | `{ month, year }` | `{ payroll }` |
| PATCH | `/payrolls/:id/items/:itemId` | Điều chỉnh lương nhân viên | `{ allowances, bonus, deduction, notes }` | `{ item }` |
| POST | `/payrolls/:id/finalize` | Finalize bảng lương | - | `{ payroll }` |
| GET | `/payrolls/my-payslips/list` | Phiếu lương của tôi | - | `{ payslips[] }` |
| GET | `/payrolls/my-payslips/:itemId` | Chi tiết phiếu lương | - | `{ payslip }` |
| GET | `/payrolls/my-ytd-summary` | Tổng hợp thu nhập năm | Query: `year` | `{ ytdSummary }` |

**Payroll Workflow Endpoints**:

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/payrolls/:id/submit` | Gửi duyệt | - | `{ payroll }` |
| POST | `/payrolls/:id/approve` | Phê duyệt | `{ notes }` | `{ payroll }` |
| POST | `/payrolls/:id/reject` | Từ chối | `{ reason }` | `{ payroll }` |
| POST | `/payrolls/:id/lock` | Khóa sau thanh toán | - | `{ payroll }` |
| POST | `/payrolls/:id/create-revision` | Tạo phiên bản mới | `{ reason }` | `{ newPayroll }` |
| GET | `/payrolls/:id/history` | Lịch sử phê duyệt | - | `{ history[] }` |
| POST | `/payrolls/bulk-approve` | Duyệt hàng loạt | `{ payrollIds[], notes }` | `{ results[] }` |

**Salary Components Controller** (`/api/salary-components`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/salary-components` | Danh sách components | Query: `employeeId, componentType, isActive, page, limit` | `{ components[], total }` |
| GET | `/salary-components/employee/:employeeId` | Components của nhân viên | - | `{ components[] }` |
| GET | `/salary-components/:id` | Chi tiết component | - | `{ component }` |
| POST | `/salary-components` | Tạo component mới | `{ employeeId, componentType, amount, effectiveDate, note }` | `{ component }` |
| PATCH | `/salary-components/:id` | Cập nhật component | `{ amount, isActive, note }` | `{ component }` |
| DELETE | `/salary-components/:id` | Xóa component | - | `{ message }` |

#### 7.4. Business Logic

**Payroll Calculation Process**:

1. **Tạo bảng lương**:
   - Input: month, year
   - Lấy tất cả nhân viên ACTIVE
   - Tính lương cho từng nhân viên
   - Tạo Payroll với status = DRAFT

2. **Tính lương cho 1 nhân viên**:
   ```typescript
   // Step 1: Lấy thông tin cơ bản
   baseSalary = employee.baseSalary
   workDays = getWorkDaysInMonth(month, year) // Không tính weekend & holidays
   actualWorkDays = countPresentDays(employee, month, year)
   
   // Step 2: Tính lương theo ngày
   dailySalary = baseSalary / workDays
   salaryByDays = dailySalary * actualWorkDays
   
   // Step 3: Tính phụ cấp
   allowances = sumActiveAllowances(employee)
   
   // Step 4: Tính overtime
   overtimeHours = getApprovedOvertimeHours(employee, month, year)
   hourlyRate = baseSalary / (workDays * 8)
   overtimePay = overtimeHours * hourlyRate * OVERTIME_RATE (1.5x)
   
   // Step 5: Tính thưởng
   rewards = sumRewards(employee, month, year)
   bonus = rewards + performanceBonus
   
   // Step 6: Tính khấu trừ
   disciplines = sumDisciplines(employee, month, year)
   deduction = disciplines + advances + loans
   
   // Step 7: Tính gross salary
   grossSalary = salaryByDays + allowances + overtimePay + bonus - deduction
   
   // Step 8: Tính bảo hiểm (10.5% employee contribution)
   insurableIncome = min(baseSalary, INSURANCE_CAP) // Cap at 36M
   insurance = insurableIncome * INSURANCE_RATE (0.105)
   
   // Step 9: Tính thuế TNCN
   taxableIncome = grossSalary - insurance - PERSONAL_DEDUCTION (11M) - dependents
   tax = calculateProgressiveTax(taxableIncome)
   
   // Step 10: Tính lương net
   netSalary = grossSalary - insurance - tax
   ```

3. **Tính thuế TNCN (Progressive Tax)**:
   ```typescript
   Tax Brackets (2024):
   - 0 - 5M:     5%
   - 5M - 10M:   10%
   - 10M - 18M:  15%
   - 18M - 32M:  20%
   - 32M - 52M:  25%
   - 52M - 80M:  30%
   - > 80M:      35%
   
   Example: taxableIncome = 25M
   - First 5M:  5M * 5% = 250K
   - Next 5M:   5M * 10% = 500K
   - Next 8M:   8M * 15% = 1.2M
   - Next 7M:   7M * 20% = 1.4M
   Total tax = 3.35M
   ```

**Payroll Workflow**:

1. **DRAFT → PENDING_APPROVAL** (Submit):
   - HR Manager submit để xin duyệt
   - Không thể edit items sau khi submit
   - Gửi notification cho Admin

2. **PENDING_APPROVAL → APPROVED** (Approve):
   - Admin review và approve
   - Có thể thêm notes
   - Gửi notification cho HR

3. **PENDING_APPROVAL → REJECTED** (Reject):
   - Admin reject với lý do
   - HR có thể edit và submit lại
   - Gửi notification cho HR

4. **APPROVED → LOCKED** (Lock):
   - Sau khi thanh toán, lock để không thể sửa
   - Chỉ có thể tạo revision nếu cần điều chỉnh

5. **LOCKED → Create Revision**:
   - Tạo version mới từ version đã lock
   - Copy tất cả items
   - Link previousVersionId
   - Version tăng lên
   - Status = DRAFT

**Salary Components Logic**:
- Mỗi nhân viên có thể có nhiều components
- Components có effectiveDate và isActive
- Khi tính lương, chỉ lấy components isActive = true
- Components có thể tạm ngưng (set isActive = false) thay vì xóa

**Part-time Employee Handling**:
- Nếu workType = PART_TIME
- Tính lương theo giờ: hourlyRate * actualHours
- Bảo hiểm: Chỉ đóng nếu >= 20h/tuần
- Thuế: Tính bình thường

#### 7.5. Frontend Integration

**Payroll Service** (`services/payrollService.ts`):
```typescript
- getPayrolls(year, status): Promise<Payroll[]>
- getPayroll(id): Promise<PayrollDetail>
- getPayslip(employeeId, month, year): Promise<Payslip>
- createPayroll(month, year): Promise<Payroll>
- updatePayrollItem(payrollId, itemId, data): Promise<PayrollItem>
- finalizePayroll(id): Promise<Payroll>
- getMyPayslips(): Promise<Payslip[]>
- getMyPayslip(itemId): Promise<PayslipDetail>
- getYTDSummary(year): Promise<YTDSummary>
- submitForApproval(id): Promise<Payroll>
- approvePayroll(id, notes): Promise<Payroll>
- rejectPayroll(id, reason): Promise<Payroll>
- lockPayroll(id): Promise<Payroll>
- createRevision(id, reason): Promise<Payroll>
```

**Salary Component Service** (`services/salaryComponentService.ts`):
```typescript
- getSalaryComponents(params): Promise<ComponentList>
- getEmployeeComponents(employeeId): Promise<Component[]>
- createComponent(data): Promise<Component>
- updateComponent(id, data): Promise<Component>
- deleteComponent(id): Promise<void>
```

**Payroll Pages**:
- `/dashboard/payroll` - Danh sách bảng lương
- `/dashboard/payroll/:id` - Chi tiết bảng lương (table với tất cả items)
- `/dashboard/payroll/salary-structure` - Quản lý cấu trúc lương
- `/dashboard/payroll/my-payslips` - Phiếu lương của tôi (employee view)

**Payroll Components**:
- `PayrollTable.tsx` - Bảng lương với edit inline
- `PayrollSummaryChart.tsx` - Biểu đồ tổng hợp lương
- `PayslipView.tsx` - Hiển thị phiếu lương
- `SalaryStructureManager.tsx` - Quản lý components
- `PayrollWorkflowPanel.tsx` - Panel workflow (submit/approve/reject)

---

### 8. MODULE LÀM THÊM GIỜ (OVERTIME)

#### 8.1. Mô tả chức năng
Module quản lý đăng ký và phê duyệt làm thêm giờ:
- Đăng ký OT với thời gian cụ thể
- Quy trình phê duyệt
- Tính toán giờ OT tự động
- Tích hợp vào payroll (tính lương OT)
- Báo cáo OT theo tháng
- Gửi email thông báo khi duyệt

#### 8.2. Database Models

**OvertimeRequest Model** (`overtime_requests` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- date: Date - Ngày làm thêm
- startTime: DateTime - Giờ bắt đầu
- endTime: DateTime - Giờ kết thúc
- hours: Decimal - Số giờ làm thêm (tự động tính)
- reason: String - Lý do làm thêm
- status: String - PENDING, APPROVED, REJECTED, CANCELLED
- approverId: UUID (nullable) - Người phê duyệt
- approvedAt: DateTime (nullable)
- rejectedReason: String (nullable)
- createdAt, updatedAt: DateTime
```

#### 8.3. Backend Endpoints

**Overtime Controller** (`/api/overtime`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/overtime` | Đăng ký OT (user hiện tại) | `{ date, startTime, endTime, reason }` | `{ request }` |
| POST | `/overtime/employee/:employeeId` | Đăng ký OT cho nhân viên (HR) | `{ date, startTime, endTime, reason }` | `{ request }` |
| GET | `/overtime` | Danh sách đơn OT | Query: `status, employeeId, month, year, page, limit` | `{ requests[], total }` |
| GET | `/overtime/pending` | Đơn chờ duyệt | - | `{ requests[] }` |
| GET | `/overtime/my-requests` | Đơn OT của tôi | - | `{ requests[] }` |
| GET | `/overtime/employee/:employeeId` | Đơn OT của nhân viên | - | `{ requests[] }` |
| GET | `/overtime/employee/:employeeId/hours/:month/:year` | Tổng giờ OT đã duyệt | - | `{ totalHours }` |
| GET | `/overtime/report/:month/:year` | Báo cáo OT tháng | - | `{ report }` |
| GET | `/overtime/:id` | Chi tiết đơn OT | - | `{ request }` |
| POST | `/overtime/:id/approve` | Duyệt đơn OT | - | `{ request }` |
| POST | `/overtime/:id/reject` | Từ chối đơn OT | `{ rejectedReason }` | `{ request }` |
| DELETE | `/overtime/:id` | Hủy đơn OT | - | `{ message }` |

#### 8.4. Business Logic

**Overtime Request Creation**:
1. Nhập date, startTime, endTime, reason
2. Tự động tính hours = (endTime - startTime) / 3600000 (ms to hours)
3. Validation:
   - startTime < endTime
   - date không được trong quá khứ quá xa (VD: max 7 ngày)
   - Không overlap với OT requests khác
   - Không overlap với leave requests
4. Tạo request với status = PENDING
5. Gửi notification cho manager

**Overtime Approval**:
1. Manager/HR review request
2. Approve:
   - Cập nhật status = APPROVED
   - Ghi nhận approverId và approvedAt
   - Gửi email thông báo (template: `overtime-approved.hbs`)
   - Ghi log vào employee_activities
3. Reject:
   - Cập nhật status = REJECTED
   - Ghi lý do từ chối
   - Gửi email thông báo

**Integration with Payroll**:
- Khi tính lương, query tất cả OT requests APPROVED trong tháng
- Tính tổng overtimeHours
- Tính overtimePay = hours * hourlyRate * OVERTIME_RATE (1.5x)
- Cộng vào gross salary

**Overtime Rate Calculation**:
```typescript
// Lương theo giờ
hourlyRate = baseSalary / (workDays * 8)

// Ví dụ: baseSalary = 20M, workDays = 22
hourlyRate = 20,000,000 / (22 * 8) = 113,636 VND/hour

// OT pay (1.5x)
overtimePay = overtimeHours * hourlyRate * 1.5

// Ví dụ: 10 giờ OT
overtimePay = 10 * 113,636 * 1.5 = 1,704,540 VND
```

**Overtime Types (có thể mở rộng)**:
- Weekday OT: 1.5x (150%)
- Weekend OT: 2.0x (200%)
- Holiday OT: 3.0x (300%)
- Night shift OT: 1.3x (130%)

**Validation Rules**:
- Không OT quá 4 giờ/ngày (theo luật)
- Không OT quá 40 giờ/tháng
- Không OT quá 200 giờ/năm (trừ trường hợp đặc biệt)

#### 8.5. Email Notification

**Overtime Approved Email** (`overtime-approved.hbs`):
```handlebars
Subject: Overtime Request Approved
Content:
- Employee name
- Date
- Start time - End time
- Total hours
- Reason
- Approver name
```

#### 8.6. Frontend Integration

**Overtime Service** (`services/overtimeService.ts`):
```typescript
- getOvertimeRequests(params): Promise<OvertimeList>
- getPendingRequests(): Promise<OvertimeRequest[]>
- getMyRequests(): Promise<OvertimeRequest[]>
- getOvertimeRequest(id): Promise<OvertimeRequest>
- createOvertimeRequest(data): Promise<OvertimeRequest>
- approveOvertimeRequest(id): Promise<OvertimeRequest>
- rejectOvertimeRequest(id, reason): Promise<OvertimeRequest>
- cancelOvertimeRequest(id): Promise<void>
- getApprovedHours(employeeId, month, year): Promise<number>
- getMonthlyReport(month, year): Promise<Report>
```

**Overtime Pages**:
- `/dashboard/overtime` - Danh sách đơn OT
- `/dashboard/overtime/new` - Đăng ký OT mới
- `/dashboard/overtime/:id` - Chi tiết đơn OT
- `/dashboard/overtime/reports` - Báo cáo OT

**Overtime Components**:
- `OvertimeRequestForm.tsx` - Form đăng ký OT
- `OvertimeApprovalPanel.tsx` - Panel duyệt OT
- `OvertimeCalendar.tsx` - Lịch OT
- `OvertimeReportChart.tsx` - Biểu đồ báo cáo OT

---

### 9. MODULE KHEN THƯỞNG & KỶ LUẬT (REWARDS & DISCIPLINES)

#### 9.1. Mô tả chức năng
Module quản lý khen thưởng và kỷ luật nhân viên:
- Ghi nhận thành tích và khen thưởng
- Ghi nhận vi phạm và kỷ luật
- Tích hợp vào payroll (cộng thưởng, trừ phạt)
- Lịch sử khen thưởng/kỷ luật của nhân viên
- Báo cáo và thống kê

#### 9.2. Database Models

**Reward Model** (`rewards` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên được thưởng
- reason: String - Lý do khen thưởng
- amount: Decimal - Số tiền thưởng
- rewardDate: Date - Ngày thưởng
- rewardType: String (nullable) - Loại thưởng
  * PERFORMANCE: Thưởng hiệu suất
  * PROJECT_COMPLETION: Hoàn thành dự án
  * INNOVATION: Sáng kiến
  * ATTENDANCE: Chuyên cần
  * CUSTOMER_SERVICE: Dịch vụ khách hàng
  * TEAMWORK: Tinh thần đồng đội
  * OTHER: Khác
- createdBy: UUID - Người tạo
- createdAt, updatedAt: DateTime
```

**Discipline Model** (`disciplines` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên bị kỷ luật
- reason: String - Lý do kỷ luật
- disciplineType: String - Loại kỷ luật
  * WARNING: Cảnh cáo
  * REPRIMAND: Khiển trách
  * SALARY_DEDUCTION: Trừ lương
  * SUSPENSION: Đình chỉ công việc
  * DEMOTION: Giáng chức
  * TERMINATION: Chấm dứt hợp đồng
- amount: Decimal - Số tiền phạt (default: 0)
- disciplineDate: Date - Ngày kỷ luật
- createdBy: UUID - Người tạo
- createdAt, updatedAt: DateTime
```

#### 9.3. Backend Endpoints

**Rewards Controller** (`/api/rewards`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/rewards` | Danh sách khen thưởng | Query: `employeeId, page, limit` | `{ rewards[], total }` |
| GET | `/rewards/employee/:employeeId` | Khen thưởng của nhân viên | - | `{ rewards[] }` |
| POST | `/rewards` | Tạo khen thưởng | `{ employeeId, reason, amount, rewardDate, rewardType }` | `{ reward }` |
| DELETE | `/rewards/:id` | Xóa khen thưởng | - | `{ message }` |

**Disciplines Controller** (`/api/disciplines`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/disciplines` | Danh sách kỷ luật | Query: `employeeId, page, limit` | `{ disciplines[], total }` |
| GET | `/disciplines/employee/:employeeId` | Kỷ luật của nhân viên | - | `{ disciplines[] }` |
| POST | `/disciplines` | Tạo kỷ luật | `{ employeeId, reason, disciplineType, amount, disciplineDate }` | `{ discipline }` |
| DELETE | `/disciplines/:id` | Xóa kỷ luật | - | `{ message }` |

#### 9.4. Business Logic

**Reward Creation**:
1. Nhập thông tin: employeeId, reason, amount, rewardDate, rewardType
2. Validation:
   - amount > 0
   - rewardDate không được trong tương lai
   - Employee phải tồn tại và ACTIVE
3. Tạo reward record
4. Ghi log vào employee_activities
5. Gửi notification cho nhân viên

**Discipline Creation**:
1. Nhập thông tin: employeeId, reason, disciplineType, amount, disciplineDate
2. Validation:
   - disciplineDate không được trong tương lai
   - Employee phải tồn tại
   - Nếu disciplineType = SALARY_DEDUCTION → amount > 0
3. Tạo discipline record
4. Ghi log vào employee_activities
5. Gửi notification cho nhân viên
6. Nếu disciplineType = TERMINATION → Trigger contract termination workflow

**Integration with Payroll**:

**Rewards**:
- Khi tính lương, query tất cả rewards trong tháng
- Tính tổng rewards amount
- Cộng vào bonus trong payroll item
- Hiển thị chi tiết trong payslip

**Disciplines**:
- Khi tính lương, query tất cả disciplines trong tháng
- Tính tổng discipline amount (chỉ SALARY_DEDUCTION)
- Cộng vào deduction trong payroll item
- Hiển thị chi tiết trong payslip

**Discipline Types Handling**:

1. **WARNING (Cảnh cáo)**:
   - Không trừ lương (amount = 0)
   - Ghi nhận vào hồ sơ
   - Ảnh hưởng đến đánh giá hiệu suất

2. **REPRIMAND (Khiển trách)**:
   - Có thể trừ lương nhẹ
   - Ghi nhận vào hồ sơ
   - Ảnh hưởng đến thăng tiến

3. **SALARY_DEDUCTION (Trừ lương)**:
   - Trừ trực tiếp vào lương tháng
   - Tối đa 30% lương (theo luật)
   - Ghi rõ lý do trong payslip

4. **SUSPENSION (Đình chỉ)**:
   - Tạm ngưng công việc
   - Không hưởng lương trong thời gian đình chỉ
   - Cập nhật employee status

5. **DEMOTION (Giáng chức)**:
   - Thay đổi position
   - Có thể giảm lương
   - Cập nhật employee record

6. **TERMINATION (Chấm dứt HĐ)**:
   - Trigger contract termination
   - Tính toán bồi thường (nếu có)
   - Cập nhật employee status = TERMINATED

**Reward Types Handling**:

1. **PERFORMANCE**: Thưởng định kỳ theo KPI
2. **PROJECT_COMPLETION**: Thưởng khi hoàn thành dự án
3. **INNOVATION**: Thưởng sáng kiến cải tiến
4. **ATTENDANCE**: Thưởng chuyên cần (không nghỉ, không muộn)
5. **CUSTOMER_SERVICE**: Thưởng phục vụ khách hàng tốt
6. **TEAMWORK**: Thưởng tinh thần đồng đội
7. **OTHER**: Các loại thưởng khác

**Statistics & Reports**:
- Tổng số lần khen thưởng/kỷ luật theo nhân viên
- Tổng số tiền thưởng/phạt theo tháng/năm
- Top nhân viên được thưởng nhiều nhất
- Phân tích xu hướng kỷ luật theo phòng ban
- Báo cáo hiệu quả khen thưởng

#### 9.5. Frontend Integration

**Reward Service** (`services/rewardService.ts`):
```typescript
- getRewards(params): Promise<RewardList>
- getEmployeeRewards(employeeId): Promise<Reward[]>
- createReward(data): Promise<Reward>
- deleteReward(id): Promise<void>
- getRewardStatistics(year): Promise<Statistics>
```

**Discipline Service** (`services/disciplineService.ts`):
```typescript
- getDisciplines(params): Promise<DisciplineList>
- getEmployeeDisciplines(employeeId): Promise<Discipline[]>
- createDiscipline(data): Promise<Discipline>
- deleteDiscipline(id): Promise<void>
- getDisciplineStatistics(year): Promise<Statistics>
```

**Rewards & Disciplines Pages**:
- `/dashboard/rewards` - Danh sách khen thưởng
- `/dashboard/rewards/new` - Tạo khen thưởng mới
- `/dashboard/disciplines` - Danh sách kỷ luật
- `/dashboard/disciplines/new` - Tạo kỷ luật mới
- `/dashboard/performance/overview` - Tổng quan hiệu suất (bao gồm rewards & disciplines)

**Components**:
- `RewardForm.tsx` - Form tạo khen thưởng
- `DisciplineForm.tsx` - Form tạo kỷ luật
- `RewardHistory.tsx` - Lịch sử khen thưởng
- `DisciplineHistory.tsx` - Lịch sử kỷ luật
- `PerformanceTimeline.tsx` - Timeline khen thưởng & kỷ luật
- `RewardStatisticsChart.tsx` - Biểu đồ thống kê thưởng
- `DisciplineAnalytics.tsx` - Phân tích kỷ luật

---

## KẾT LUẬN PHẦN 3

Ba module này quản lý các khía cạnh tài chính và hiệu suất:

1. **Payroll & Salary Components**: Tính lương tự động với workflow phê duyệt
   - Tính thuế TNCN và bảo hiểm theo luật VN
   - Cấu trúc lương linh hoạt với components
   - Versioning và revision
   - Payslip cho nhân viên

2. **Overtime**: Quản lý làm thêm giờ
   - Đăng ký và phê duyệt OT
   - Tính lương OT tự động (1.5x)
   - Tích hợp vào payroll
   - Báo cáo OT theo tháng

3. **Rewards & Disciplines**: Khen thưởng và kỷ luật
   - 7 loại thưởng và 6 loại kỷ luật
   - Tích hợp vào payroll (cộng thưởng, trừ phạt)
   - Lịch sử và thống kê
   - Ảnh hưởng đến đánh giá hiệu suất

Mối quan hệ giữa các module:
- Payroll ← Attendance (actual work days)
- Payroll ← Overtime (overtime pay)
- Payroll ← Rewards (bonus)
- Payroll ← Disciplines (deduction)
- Payroll ← SalaryComponents (allowances)
- Payroll ← LeaveRequests (unpaid leave deduction)

---

**Vui lòng review phần 3 này. Nếu OK, tôi sẽ tiếp tục với các module còn lại:**
- Module Dashboard & Báo cáo
- Module Lịch làm việc (Calendar & Work Schedules)
- Module Thông báo (Notifications)
- Module Chatbot AI (RAG)
- Module Nhận diện khuôn mặt (Face Recognition)
- Module Export & Upload
- Module Teams
