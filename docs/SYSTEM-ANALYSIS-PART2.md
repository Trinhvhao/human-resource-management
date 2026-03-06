# HỆ THỐNG QUẢN LÝ NHÂN SỰ - PHẦN 2

## PHẦN 2: MODULE QUẢN LÝ HỢP ĐỒNG & CHẤM CÔNG (3 MODULE)

### 4. MODULE HỢP ĐỒNG (CONTRACTS)

#### 4.1. Mô tả chức năng
Module quản lý hợp đồng lao động toàn diện với các tính năng:
- Quản lý nhiều loại hợp đồng (thử việc, xác định thời hạn, không xác định thời hạn)
- Theo dõi hợp đồng sắp hết hạn
- Quy trình chấm dứt hợp đồng có phê duyệt
- Gia hạn và phụ lục hợp đồng
- Validation tuân thủ luật lao động Việt Nam

#### 4.2. Database Models

**Contract Model** (`contracts` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- contractType: String - Loại hợp đồng
  * PROBATION: Thử việc (tối đa 60 ngày)
  * FIXED_TERM: Xác định thời hạn (12-36 tháng)
  * INDEFINITE: Không xác định thời hạn
  * SEASONAL: Theo mùa vụ
- workType: String - Hình thức làm việc
  * FULL_TIME: Toàn thời gian (40h/tuần)
  * PART_TIME: Bán thời gian
  * REMOTE: Làm từ xa
  * HYBRID: Kết hợp
- workHoursPerWeek: Int - Số giờ làm/tuần (default: 40)
- contractNumber: String (unique, nullable) - Số hợp đồng
- startDate: Date - Ngày bắt đầu
- endDate: Date (nullable) - Ngày kết thúc
- salary: Decimal - Mức lương
- terms: String (nullable) - Điều khoản hợp đồng
- notes: String (nullable) - Ghi chú
- fileUrl: String (nullable) - URL file hợp đồng scan
- status: String - ACTIVE, EXPIRED, TERMINATED
- terminatedReason: String (nullable) - Lý do chấm dứt
- createdAt, updatedAt: DateTime
```

**TerminationRequest Model** (`termination_requests` table):
```prisma
- id: UUID
- contractId: UUID - Hợp đồng cần chấm dứt
- requestedBy: UUID - Người yêu cầu
- terminationCategory: String - Loại chấm dứt
  * MUTUAL_AGREEMENT: Thỏa thuận hai bên
  * EMPLOYEE_RESIGNATION: Nhân viên xin nghỉ
  * EMPLOYER_TERMINATION: Công ty chấm dứt
  * CONTRACT_EXPIRY: Hết hạn hợp đồng
  * DISCIPLINARY: Kỷ luật
- noticeDate: Date - Ngày thông báo
- terminationDate: Date - Ngày chấm dứt
- reason: String - Lý do chi tiết
- status: String - PENDING_APPROVAL, APPROVED, REJECTED
- approverId: UUID (nullable) - Người phê duyệt
- approvedAt: DateTime (nullable)
- approverComments: String (nullable) - Nhận xét của người duyệt
- rejectionReason: String (nullable)
- createdAt, updatedAt: DateTime
```

**ContractAppendix Model** (`contract_appendices` table):
```prisma
- id: UUID
- contractId: UUID - Hợp đồng gốc
- appendixNumber: String - Số phụ lục
- effectiveDate: Date - Ngày hiệu lực
- modifiedFields: JSON - Các trường được thay đổi
  * Ví dụ: { "salary": 15000000, "position": "Senior Developer" }
- reason: String - Lý do thay đổi
- createdBy: UUID - Người tạo
- createdAt, updatedAt: DateTime
```

#### 4.3. Backend Endpoints

**Contracts Controller** (`/api/contracts`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/contracts` | Danh sách hợp đồng | Query: `employeeId, status, search, page, limit` | `{ contracts[], total }` |
| GET | `/contracts/expiring` | Hợp đồng sắp hết hạn | Query: `days` (default: 30) | `{ contracts[] }` |
| GET | `/contracts/statistics` | Thống kê hợp đồng | - | `{ total, active, expired, expiring }` |
| GET | `/contracts/employee/:employeeId` | Hợp đồng của nhân viên | - | `{ contracts[] }` |
| GET | `/contracts/:id` | Chi tiết hợp đồng | - | `{ contract }` |
| POST | `/contracts` | Tạo hợp đồng mới | `{ employeeId, contractType, workType, startDate, endDate, salary, terms }` | `{ contract }` |
| PATCH | `/contracts/:id` | Cập nhật hợp đồng | `{ salary, terms, notes }` | `{ contract }` |
| POST | `/contracts/:id/renew` | Gia hạn hợp đồng | `{ newStartDate, newEndDate, newSalary, contractType }` | `{ newContract }` |
| POST | `/contracts/:id/terminate` | Chấm dứt hợp đồng (trực tiếp) | `{ terminatedReason, terminationDate }` | `{ contract }` |

**Termination Requests** (`/api/contracts/termination-requests`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/contracts/termination-requests` | Tạo yêu cầu chấm dứt | `{ contractId, terminationCategory, noticeDate, terminationDate, reason }` | `{ request }` |
| GET | `/contracts/termination-requests/pending` | Yêu cầu chờ duyệt | - | `{ requests[] }` |
| GET | `/contracts/termination-requests/:id` | Chi tiết yêu cầu | - | `{ request }` |
| GET | `/contracts/:id/termination-requests` | Yêu cầu của hợp đồng | - | `{ requests[] }` |
| POST | `/contracts/termination-requests/:id/approve` | Phê duyệt chấm dứt | `{ approverComments }` | `{ request }` |
| POST | `/contracts/termination-requests/:id/reject` | Từ chối chấm dứt | `{ rejectionReason }` | `{ request }` |

#### 4.4. Business Logic

**Contract Validation (Tuân thủ Luật Lao động VN)**:

1. **Hợp đồng thử việc (PROBATION)**:
   - Thời hạn tối đa: 60 ngày (2 tháng)
   - Không được ký quá 1 lần cho cùng 1 vị trí
   - Phải chuyển sang hợp đồng chính thức sau khi hết thử việc

2. **Hợp đồng xác định thời hạn (FIXED_TERM)**:
   - Thời hạn: 12-36 tháng
   - Chỉ được ký tối đa 2 lần liên tiếp
   - Lần thứ 3 phải chuyển sang không xác định thời hạn

3. **Hợp đồng không xác định thời hạn (INDEFINITE)**:
   - Không có ngày kết thúc
   - Áp dụng sau 2 hợp đồng xác định thời hạn
   - Hoặc sau khi hết thử việc (nếu thỏa thuận)

**Quy trình chấm dứt hợp đồng**:

1. **Tạo yêu cầu chấm dứt**:
   - Chọn loại chấm dứt (mutual, resignation, termination, expiry, disciplinary)
   - Nhập ngày thông báo và ngày chấm dứt
   - Kiểm tra thời gian báo trước (notice period):
     * Thử việc: 3 ngày
     * Xác định thời hạn: 30 ngày
     * Không xác định thời hạn: 45 ngày

2. **Phê duyệt**:
   - HR Manager hoặc Admin review
   - Approve → Contract status = TERMINATED
   - Reject → Request status = REJECTED, contract vẫn ACTIVE

3. **Tự động cập nhật**:
   - Cập nhật employee.status = TERMINATED
   - Cập nhật employee.endDate
   - Ghi log vào employee_activities

**Contract Renewal (Gia hạn)**:
- Tạo hợp đồng mới từ hợp đồng cũ
- Kế thừa thông tin nhân viên
- Có thể thay đổi: salary, contractType, workType
- Hợp đồng cũ tự động chuyển sang EXPIRED

**Contract Appendix (Phụ lục)**:
- Ghi lại các thay đổi trong quá trình thực hiện hợp đồng
- Lưu trữ JSON các trường thay đổi
- Không tạo hợp đồng mới

#### 4.5. Frontend Integration

**Contract Service** (`services/contractService.ts`):
```typescript
- getContracts(params): Promise<ContractList>
- getExpiringContracts(days): Promise<Contract[]>
- getContractStatistics(): Promise<Statistics>
- getContract(id): Promise<Contract>
- createContract(data): Promise<Contract>
- updateContract(id, data): Promise<Contract>
- renewContract(id, data): Promise<Contract>
- terminateContract(id, data): Promise<Contract>
```

**Termination Request Service** (`services/terminationRequestService.ts`):
```typescript
- createTerminationRequest(data): Promise<TerminationRequest>
- getPendingTerminations(): Promise<TerminationRequest[]>
- getTerminationRequest(id): Promise<TerminationRequest>
- approveTermination(id, comments): Promise<TerminationRequest>
- rejectTermination(id, reason): Promise<TerminationRequest>
```

**Contract Pages**:
- `/dashboard/contracts` - Danh sách hợp đồng (table/card view)
- `/dashboard/contracts/new` - Tạo hợp đồng mới
- `/dashboard/contracts/:id` - Chi tiết hợp đồng
- `/dashboard/contracts/terminations` - Quản lý yêu cầu chấm dứt

**Contract Components**:
- `ContractForm.tsx` - Form tạo/sửa hợp đồng
- `ContractViewSwitcher.tsx` - Chuyển đổi view
- `ContractExpirationAlerts.tsx` - Cảnh báo hợp đồng sắp hết hạn
- `TerminationApprovalPanel.tsx` - Panel duyệt chấm dứt
- `TerminationHistory.tsx` - Lịch sử chấm dứt
- `TerminationAlertsWidget.tsx` - Widget cảnh báo

---

### 5. MODULE CHẤM CÔNG (ATTENDANCE)

#### 5.1. Mô tả chức năng
Module quản lý chấm công tự động với các tính năng:
- Check-in/Check-out hàng ngày
- Tự động tính giờ làm việc
- Phát hiện đi muộn/về sớm
- Tự động đánh vắng nếu không check-in
- Báo cáo và thống kê chấm công
- Yêu cầu điều chỉnh chấm công

#### 5.2. Database Models

**Attendance Model** (`attendances` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- date: Date - Ngày chấm công
- checkIn: DateTime (nullable) - Giờ vào
- checkOut: DateTime (nullable) - Giờ ra
- workHours: Decimal (nullable) - Số giờ làm việc
- isLate: Boolean - Có đi muộn không (default: false)
- isEarlyLeave: Boolean - Có về sớm không (default: false)
- status: String - Trạng thái
  * PRESENT: Có mặt
  * ABSENT: Vắng mặt
  * LATE: Đi muộn
  * EARLY_LEAVE: Về sớm
  * HALF_DAY: Nửa ngày
  * ON_LEAVE: Nghỉ phép
  * BUSINESS_TRIP: Công tác
- notes: String (nullable) - Ghi chú
- createdAt, updatedAt: DateTime

Unique constraint: [employeeId, date]
```

**AttendanceCorrection Model** (`attendance_corrections` table):
```prisma
- id: UUID
- employeeId: UUID - Nhân viên yêu cầu
- attendanceId: UUID (nullable) - Bản ghi chấm công cần sửa
- date: Date - Ngày cần điều chỉnh
- originalCheckIn: DateTime (nullable) - Giờ vào gốc
- originalCheckOut: DateTime (nullable) - Giờ ra gốc
- requestedCheckIn: DateTime (nullable) - Giờ vào đề xuất
- requestedCheckOut: DateTime (nullable) - Giờ ra đề xuất
- reason: String - Lý do điều chỉnh
- status: String - PENDING, APPROVED, REJECTED
- approverId: UUID (nullable) - Người phê duyệt
- approvedAt: DateTime (nullable)
- rejectedReason: String (nullable)
- createdAt, updatedAt: DateTime
```

#### 5.3. Backend Endpoints

**Attendances Controller** (`/api/attendances`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/attendances/check-in` | Check-in (user hiện tại) | - | `{ attendance }` |
| POST | `/attendances/check-in/:employeeId` | Check-in cho nhân viên (HR) | - | `{ attendance }` |
| POST | `/attendances/check-out` | Check-out (user hiện tại) | - | `{ attendance }` |
| POST | `/attendances/check-out/:employeeId` | Check-out cho nhân viên (HR) | - | `{ attendance }` |
| GET | `/attendances/today` | Chấm công hôm nay (của tôi) | - | `{ attendance }` |
| GET | `/attendances/my` | Chấm công của tôi | Query: `month, year` | `{ attendances[] }` |
| GET | `/attendances/today/all` | Tất cả chấm công hôm nay (HR) | - | `{ attendances[] }` |
| GET | `/attendances/employee/:employeeId` | Chấm công của nhân viên | Query: `month, year` | `{ attendances[] }` |
| GET | `/attendances/report` | Báo cáo tháng | Query: `month, year` (required) | `{ report }` |
| GET | `/attendances/statistics` | Thống kê chấm công | Query: `month, year` | `{ stats }` |
| GET | `/attendances/absenteeism-stats` | Thống kê vắng mặt & đi muộn | - | `{ today, week, month, trends }` |
| POST | `/attendances/auto-mark-absent` | Trigger đánh vắng thủ công | - | `{ message, count }` |
| GET | `/attendances/validate` | Kiểm tra dữ liệu chấm công | Query: `month, year` (required) | `{ missingDays, incompleteRecords }` |

**Attendance Corrections Controller** (`/api/attendance-corrections`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/attendance-corrections` | Danh sách yêu cầu điều chỉnh | Query: `employeeId, status, page, limit` | `{ corrections[], total }` |
| GET | `/attendance-corrections/pending` | Yêu cầu chờ duyệt | - | `{ corrections[] }` |
| GET | `/attendance-corrections/my` | Yêu cầu của tôi | - | `{ corrections[] }` |
| GET | `/attendance-corrections/:id` | Chi tiết yêu cầu | - | `{ correction }` |
| POST | `/attendance-corrections` | Tạo yêu cầu điều chỉnh | `{ date, requestedCheckIn, requestedCheckOut, reason }` | `{ correction }` |
| POST | `/attendance-corrections/:id/approve` | Phê duyệt điều chỉnh | - | `{ correction }` |
| POST | `/attendance-corrections/:id/reject` | Từ chối điều chỉnh | `{ rejectedReason }` | `{ correction }` |
| DELETE | `/attendance-corrections/:id` | Hủy yêu cầu | - | `{ message }` |

#### 5.4. Business Logic

**Check-in Logic**:
1. Kiểm tra đã check-in hôm nay chưa
2. Tạo record mới với checkIn = current time
3. So sánh với giờ quy định (8:00 AM):
   - Nếu sau 8:00 → `isLate = true`, `status = LATE`
   - Nếu đúng giờ → `status = PRESENT`
4. Ghi log vào employee_activities

**Check-out Logic**:
1. Tìm record check-in hôm nay
2. Cập nhật checkOut = current time
3. Tính workHours = (checkOut - checkIn) - lunch break (1h)
4. So sánh với giờ quy định (17:00 PM):
   - Nếu trước 17:00 → `isEarlyLeave = true`
5. Cập nhật status nếu cần

**Auto Mark Absent (Scheduled Job)**:
- Chạy tự động lúc 19:00 (7 PM) mỗi ngày
- Tìm tất cả nhân viên ACTIVE
- Kiểm tra ai chưa có attendance record hôm nay
- Tạo record với `status = ABSENT`, không có checkIn/checkOut
- Loại trừ: nhân viên đang nghỉ phép, công tác, ngày lễ

**Attendance Validation**:
- Kiểm tra missing days: Ngày làm việc không có record
- Kiểm tra incomplete records: Có checkIn nhưng không có checkOut
- Trả về danh sách để HR xử lý

**Attendance Correction Flow**:
1. Nhân viên tạo yêu cầu điều chỉnh với lý do
2. Manager hoặc HR review
3. Approve → Cập nhật attendance record
4. Reject → Giữ nguyên, ghi lý do từ chối

**Statistics Calculation**:
- Total work days: Số ngày làm việc trong tháng
- Present days: Số ngày có mặt
- Absent days: Số ngày vắng
- Late count: Số lần đi muộn
- Early leave count: Số lần về sớm
- Average work hours: Trung bình giờ làm/ngày
- Attendance rate: (Present / Total) * 100%

#### 5.5. Frontend Integration

**Attendance Service** (`services/attendanceService.ts`):
```typescript
- checkIn(): Promise<Attendance>
- checkOut(): Promise<Attendance>
- getTodayAttendance(): Promise<Attendance>
- getMyAttendances(month, year): Promise<Attendance[]>
- getEmployeeAttendances(employeeId, month, year): Promise<Attendance[]>
- getMonthlyReport(month, year): Promise<Report>
- getStatistics(month, year): Promise<Statistics>
- getAbsenteeismStats(): Promise<AbsenteeismStats>
- validateAttendanceData(month, year): Promise<ValidationResult>
```

**Attendance Pages**:
- `/dashboard/attendance` - Trang chấm công chính (check-in/out, today stats)
- `/dashboard/attendance/reports` - Báo cáo chấm công
- `/dashboard/attendance/corrections` - Quản lý yêu cầu điều chỉnh

**Attendance Components**:
- `AttendanceQuickStats.tsx` - Thống kê nhanh (present, absent, late)
- `AttendanceLiveFeed.tsx` - Feed real-time check-in/out
- `AttendanceTrendChart.tsx` - Biểu đồ xu hướng chấm công
- `AttendanceChart.tsx` - Biểu đồ chấm công tháng
- `CorrectionRequestForm.tsx` - Form yêu cầu điều chỉnh

---

### 6. MODULE NGHỈ PHÉP (LEAVE REQUESTS)

#### 6.1. Mô tả chức năng
Module quản lý nghỉ phép với các tính năng:
- Đăng ký nghỉ phép (annual leave, sick leave, unpaid leave)
- Quy trình phê duyệt nghỉ phép
- Quản lý số ngày phép còn lại
- Tích lũy phép hàng tháng
- Chuyển phép sang năm sau
- Gửi email thông báo khi duyệt/từ chối

#### 6.2. Database Models

**LeaveRequest Model** (`leave_requests` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- leaveType: String - Loại nghỉ phép
  * ANNUAL: Nghỉ phép năm
  * SICK: Nghỉ ốm
  * UNPAID: Nghỉ không lương
  * MATERNITY: Nghỉ thai sản
  * PATERNITY: Nghỉ chăm con
  * MARRIAGE: Nghỉ kết hôn
  * BEREAVEMENT: Nghỉ tang
  * COMPENSATORY: Nghỉ bù
- startDate: Date - Ngày bắt đầu
- endDate: Date - Ngày kết thúc
- totalDays: Int - Tổng số ngày nghỉ
- reason: String - Lý do nghỉ
- status: String - PENDING, APPROVED, REJECTED, CANCELLED
- approverId: UUID (nullable) - Người phê duyệt
- approvedAt: DateTime (nullable)
- rejectedReason: String (nullable)
- createdAt, updatedAt: DateTime
```

**LeaveBalance Model** (`leave_balances` table):
```prisma
- id: UUID
- employeeId: UUID - Nhân viên
- year: Int - Năm
- annualLeave: Int - Tổng phép năm (default: 12)
- sickLeave: Int - Tổng phép ốm (default: 30)
- usedAnnual: Int - Đã dùng phép năm (default: 0)
- usedSick: Int - Đã dùng phép ốm (default: 0)
- carriedOver: Int - Phép chuyển từ năm trước (default: 0)
- createdAt, updatedAt: DateTime

Unique constraint: [employeeId, year]
```

**LeaveAccrualHistory Model** (`leave_accrual_history` table):
```prisma
- id: UUID
- employeeId: UUID
- year: Int
- month: Int
- daysAdded: Int - Số ngày được cộng
- balanceBefore: Int - Số dư trước khi cộng
- balanceAfter: Int - Số dư sau khi cộng
- accrualType: String - Loại tích lũy
  * MONTHLY: Tích lũy hàng tháng
  * ANNUAL: Cấp đầu năm
  * CARRIED_OVER: Chuyển từ năm trước
  * ADJUSTMENT: Điều chỉnh
- triggeredBy: UUID (nullable) - Người thực hiện
- notes: String (nullable)
- createdAt: DateTime
```

#### 6.3. Backend Endpoints

**Leave Requests Controller** (`/api/leave-requests`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/leave-requests` | Danh sách yêu cầu nghỉ phép | Query: `employeeId, status, page, limit` | `{ requests[], total }` |
| GET | `/leave-requests/pending` | Yêu cầu chờ duyệt | - | `{ requests[] }` |
| GET | `/leave-requests/my-requests` | Yêu cầu của tôi | - | `{ requests[] }` |
| GET | `/leave-requests/employee/:employeeId` | Yêu cầu của nhân viên | - | `{ requests[] }` |
| GET | `/leave-requests/:id` | Chi tiết yêu cầu | - | `{ request }` |
| POST | `/leave-requests` | Tạo yêu cầu nghỉ phép | `{ leaveType, startDate, endDate, reason }` | `{ request }` |
| POST | `/leave-requests/:id/approve` | Phê duyệt nghỉ phép | - | `{ request }` |
| POST | `/leave-requests/:id/reject` | Từ chối nghỉ phép | `{ rejectedReason }` | `{ request }` |
| DELETE | `/leave-requests/:id` | Hủy yêu cầu | - | `{ message }` |

**Leave Balances Controller** (`/api/leave-balances`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/leave-balances/my` | Số phép của tôi | Query: `year` | `{ balance }` |
| GET | `/leave-balances/employee/:employeeId` | Số phép của nhân viên | Query: `year` | `{ balance }` |
| GET | `/leave-balances` | Danh sách số phép | Query: `year, page, limit` | `{ balances[], total }` |
| POST | `/leave-balances/initialize/:employeeId` | Khởi tạo số phép cho nhân viên mới | `{ year, annualLeave, sickLeave }` | `{ balance }` |
| PATCH | `/leave-balances/:id/adjust` | Điều chỉnh số phép | `{ annualLeave, sickLeave, reason }` | `{ balance }` |
| POST | `/leave-balances/carry-over` | Chuyển phép sang năm sau | `{ year }` | `{ message, count }` |
| GET | `/leave-balances/:id/history` | Lịch sử tích lũy | - | `{ history[] }` |

#### 6.4. Business Logic

**Leave Request Creation**:
1. Kiểm tra số ngày phép còn lại
2. Tính totalDays (không tính weekend và holidays)
3. Kiểm tra overlap với leave requests khác
4. Tạo request với status = PENDING
5. Gửi notification cho manager

**Leave Approval Flow**:
1. Manager/HR review request
2. Approve:
   - Cập nhật status = APPROVED
   - Trừ số ngày phép trong LeaveBalance
   - Tạo attendance records với status = ON_LEAVE
   - Gửi email thông báo (template: `leave-approved.hbs`)
   - Ghi log vào employee_activities
3. Reject:
   - Cập nhật status = REJECTED
   - Gửi email với lý do từ chối
   - Không trừ số phép

**Leave Cancellation**:
- Chỉ cancel được request PENDING
- Nếu đã APPROVED, phải tạo request mới để hủy
- Hoàn lại số ngày phép nếu cancel request đã approved

**Leave Balance Initialization**:
- Tự động tạo khi tạo nhân viên mới
- Phép năm: 12 ngày (theo luật lao động VN)
- Phép ốm: 30 ngày
- Có thể điều chỉnh theo chính sách công ty

**Monthly Accrual (Tích lũy hàng tháng)**:
- Chạy scheduled job đầu mỗi tháng
- Cộng 1 ngày phép năm cho mỗi nhân viên
- Công thức: 12 ngày / 12 tháng = 1 ngày/tháng
- Ghi vào LeaveAccrualHistory

**Carry Over (Chuyển phép sang năm sau)**:
- Chạy vào 31/12 hoặc đầu năm mới
- Tối đa chuyển: 5 ngày (hoặc theo policy)
- Phép chuyển có thời hạn sử dụng (VD: hết Q1 năm sau)
- Công thức: `carriedOver = min(remainingLeave, maxCarryOver)`

**Leave Type Rules**:
- ANNUAL: Trừ từ annualLeave balance
- SICK: Trừ từ sickLeave balance (cần giấy bác sĩ nếu > 3 ngày)
- UNPAID: Không trừ balance, nhưng ảnh hưởng lương
- MATERNITY: 6 tháng (theo luật), không trừ balance
- PATERNITY: 5-14 ngày (tùy công ty)
- MARRIAGE: 3 ngày
- BEREAVEMENT: 3 ngày
- COMPENSATORY: Nghỉ bù sau OT, không trừ balance

**Validation Rules**:
- startDate phải >= today
- endDate phải >= startDate
- Không overlap với leave requests khác đã approved
- Phải có đủ số ngày phép (với ANNUAL và SICK)
- Không nghỉ quá 30 ngày liên tục (trừ maternity)

#### 6.5. Email Notifications

**Leave Approved Email** (`leave-approved.hbs`):
```handlebars
Subject: Leave Request Approved
Content:
- Employee name
- Leave type
- Start date - End date
- Total days
- Remaining balance
- Approver name
```

**Leave Rejected Email**:
```handlebars
Subject: Leave Request Rejected
Content:
- Employee name
- Leave type
- Start date - End date
- Rejection reason
- Contact HR for questions
```

#### 6.6. Frontend Integration

**Leave Request Service** (`services/leaveRequestService.ts`):
```typescript
- getLeaveRequests(params): Promise<LeaveRequestList>
- getPendingRequests(): Promise<LeaveRequest[]>
- getMyRequests(): Promise<LeaveRequest[]>
- getLeaveRequest(id): Promise<LeaveRequest>
- createLeaveRequest(data): Promise<LeaveRequest>
- approveLeaveRequest(id): Promise<LeaveRequest>
- rejectLeaveRequest(id, reason): Promise<LeaveRequest>
- cancelLeaveRequest(id): Promise<void>
```

**Leave Balance Service** (`services/leaveBalanceService.ts`):
```typescript
- getMyBalance(year): Promise<LeaveBalance>
- getEmployeeBalance(employeeId, year): Promise<LeaveBalance>
- getBalances(year, page, limit): Promise<BalanceList>
- adjustBalance(id, data): Promise<LeaveBalance>
- getBalanceHistory(id): Promise<AccrualHistory[]>
```

**Leave Pages**:
- `/dashboard/leaves` - Danh sách yêu cầu nghỉ phép
- `/dashboard/leaves/new` - Tạo yêu cầu mới
- `/dashboard/leaves/:id` - Chi tiết yêu cầu
- `/dashboard/leaves/balances` - Quản lý số phép
- `/dashboard/leaves/calendar` - Lịch nghỉ phép

**Leave Components**:
- `LeaveRequestForm.tsx` - Form đăng ký nghỉ phép
- `LeaveBalanceCard.tsx` - Card hiển thị số phép
- `LeaveCalendar.tsx` - Lịch nghỉ phép
- `LeaveApprovalPanel.tsx` - Panel duyệt nghỉ phép
- `LeaveHistory.tsx` - Lịch sử nghỉ phép

---

## KẾT LUẬN PHẦN 2

Ba module này quản lý các hoạt động hàng ngày của nhân viên:

1. **Contracts**: Quản lý hợp đồng lao động với validation tuân thủ luật
2. **Attendance**: Chấm công tự động với check-in/out và báo cáo
3. **Leave Requests**: Quản lý nghỉ phép với workflow phê duyệt

Các module có mối quan hệ:
- Contract → Employee (xác định tình trạng làm việc)
- Attendance → Employee (theo dõi giờ làm)
- Leave Request → Employee + LeaveBalance (quản lý phép)
- Leave Approved → Attendance (tạo records ON_LEAVE)

---

**Vui lòng review phần 2 này. Nếu OK, tôi sẽ tiếp tục với 3 module tiếp theo:**
- Module Lương & Thưởng (Payroll & Salary Components)
- Module Làm thêm giờ (Overtime)
- Module Khen thưởng & Kỷ luật (Rewards & Disciplines)
