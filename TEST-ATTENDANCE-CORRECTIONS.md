# Test Guide: Attendance Corrections

## Test Accounts

```
Admin:
- Email: admin@company.com
- Password: Admin@123

HR Manager:
- Email: hr.manager@company.com
- Password: Password123!

Employee:
- Email: employee1@company.com
- Password: Password123!
```

## Issue Found

**Problem**: Frontend gửi time-only format nhưng backend expect ISO datetime format

**Before Fix**:
```javascript
// Frontend gửi
{
  date: "2024-01-15",
  requestedCheckIn: "08:30",  // ❌ Time only
  requestedCheckOut: "17:30"  // ❌ Time only
}

// Backend expect
{
  date: "2024-01-15",
  requestedCheckIn: "2024-01-15T08:30:00Z",  // ✅ ISO datetime
  requestedCheckOut: "2024-01-15T17:30:00Z"  // ✅ ISO datetime
}
```

**After Fix**:
```javascript
// Frontend combine date + time thành ISO datetime
const requestedCheckIn = formData.requestedCheckIn 
  ? new Date(`${formData.date}T${formData.requestedCheckIn}:00`).toISOString()
  : undefined;
```

## Backend API Endpoints

### 1. Create Correction (Employee)
```
POST /api/attendance-corrections
Authorization: Bearer <EMPLOYEE_TOKEN>
Content-Type: application/json

{
  "date": "2024-03-07",
  "requestedCheckIn": "2024-03-07T08:30:00Z",
  "requestedCheckOut": "2024-03-07T17:30:00Z",
  "reason": "Quên check-in do họp khẩn cấp"
}
```

### 2. Get My Corrections (Employee)
```
GET /api/attendance-corrections/my-requests
Authorization: Bearer <EMPLOYEE_TOKEN>
```

### 3. Get All Corrections (HR/Admin)
```
GET /api/attendance-corrections
Authorization: Bearer <HR_TOKEN>
Query params: ?status=PENDING&employeeId=xxx
```

### 4. Get Pending Corrections (HR/Admin)
```
GET /api/attendance-corrections/pending
Authorization: Bearer <HR_TOKEN>
```

### 5. Approve Correction (HR/Admin)
```
POST /api/attendance-corrections/:id/approve
Authorization: Bearer <HR_TOKEN>
```

### 6. Reject Correction (HR/Admin)
```
POST /api/attendance-corrections/:id/reject
Authorization: Bearer <HR_TOKEN>
Content-Type: application/json

{
  "rejectedReason": "Không có bằng chứng hợp lệ"
}
```

### 7. Cancel Correction (Employee)
```
DELETE /api/attendance-corrections/:id
Authorization: Bearer <EMPLOYEE_TOKEN>
```

## Validation Rules

1. **Date**: Không được trong tương lai
2. **Check-in/Check-out**: Phải có ít nhất 1 trong 2
3. **Pending Request**: Không được tạo 2 request PENDING cho cùng 1 ngày
4. **Status**: Chỉ PENDING mới được approve/reject/cancel
5. **Permission**: Employee chỉ cancel được request của mình

## Test Scenarios

### Scenario 1: Employee tạo correction request
1. Login với employee1@company.com
2. Vào /dashboard/attendance/corrections
3. Click "Tạo yêu cầu"
4. Điền:
   - Ngày: Hôm qua hoặc hôm kia
   - Giờ check-in: 08:30
   - Giờ check-out: 17:30
   - Lý do: "Quên check-in do họp khẩn cấp"
5. Submit
6. **Expected**: Tạo thành công, hiển thị trong danh sách với status PENDING

### Scenario 2: Employee cancel request
1. Ở trang corrections
2. Click "Hủy" trên request PENDING
3. Confirm
4. **Expected**: Status chuyển thành CANCELLED

### Scenario 3: HR approve request
1. Login với hr.manager@company.com
2. Vào /dashboard/attendance/corrections (hoặc pending page)
3. Click approve trên request PENDING
4. **Expected**: 
   - Status chuyển thành APPROVED
   - Attendance record được tạo/update với giờ mới
   - Email notification gửi cho employee

### Scenario 4: HR reject request
1. Login với hr.manager@company.com
2. Click reject trên request PENDING
3. Nhập lý do từ chối
4. **Expected**:
   - Status chuyển thành REJECTED
   - Email notification gửi cho employee

### Scenario 5: Validation - Future date
1. Login employee
2. Tạo request với ngày trong tương lai
3. **Expected**: Backend trả lỗi "Không thể điều chỉnh chấm công trong tương lai"

### Scenario 6: Validation - Duplicate pending
1. Tạo request cho ngày X (status PENDING)
2. Tạo request khác cho cùng ngày X
3. **Expected**: Backend trả lỗi "Đã có yêu cầu điều chỉnh đang chờ duyệt cho ngày này"

### Scenario 7: Validation - Missing times
1. Tạo request không điền cả check-in và check-out
2. **Expected**: Frontend alert "Vui lòng điền ít nhất giờ check-in hoặc check-out"

## Manual Testing Steps

### Step 1: Start Backend
```bash
cd apps/backend
npm run start:dev
```

### Step 2: Start Frontend
```bash
cd apps/frontend
npm run dev
```

### Step 3: Test Employee Flow
1. Open http://localhost:3000/login
2. Click "Employee" demo button
3. Navigate to Attendance → Corrections
4. Create a correction request
5. Verify it appears in the list
6. Try to cancel it

### Step 4: Test HR Flow
1. Logout
2. Login with HR Manager account
3. Navigate to Attendance → Corrections (or pending)
4. Find the employee's request
5. Try to approve it
6. Verify attendance record is updated

### Step 5: Check Database
```sql
-- Check corrections
SELECT * FROM "AttendanceCorrection" ORDER BY "createdAt" DESC LIMIT 10;

-- Check attendance records
SELECT * FROM "Attendance" 
WHERE "employeeId" = 'EMPLOYEE_ID' 
ORDER BY "date" DESC LIMIT 10;
```

## Common Issues & Solutions

### Issue 1: "Invalid date format"
**Cause**: Frontend gửi time-only thay vì ISO datetime
**Solution**: ✅ Fixed - Frontend now combines date + time

### Issue 2: "Cannot read property of undefined"
**Cause**: Response structure không match với expected type
**Solution**: Check axios interceptor và error handling

### Issue 3: "Unauthorized"
**Cause**: Token expired hoặc không có
**Solution**: Re-login để lấy token mới

### Issue 4: Email không gửi
**Cause**: Mail service configuration
**Solution**: Check .env có SMTP settings chưa

## Expected Response Formats

### Success - Create Correction
```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "date": "2024-03-07T00:00:00.000Z",
  "originalCheckIn": null,
  "originalCheckOut": null,
  "requestedCheckIn": "2024-03-07T08:30:00.000Z",
  "requestedCheckOut": "2024-03-07T17:30:00.000Z",
  "reason": "Quên check-in do họp khẩn cấp",
  "status": "PENDING",
  "createdAt": "2024-03-08T10:00:00.000Z",
  "employee": {
    "id": "uuid",
    "employeeCode": "EMP001",
    "fullName": "Nhân viên Test 1",
    "email": "employee1@company.com"
  }
}
```

### Error - Validation Failed
```json
{
  "statusCode": 400,
  "message": [
    "requestedCheckIn must be a valid ISO 8601 date string"
  ],
  "error": "Bad Request"
}
```

### Error - Business Logic
```json
{
  "statusCode": 400,
  "message": "Đã có yêu cầu điều chỉnh đang chờ duyệt cho ngày này",
  "error": "Bad Request"
}
```

## Automated Test Script

See `test-attendance-corrections.ts` for automated API testing.
