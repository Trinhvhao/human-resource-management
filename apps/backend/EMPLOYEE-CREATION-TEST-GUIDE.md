# Employee Creation Test Guide

## Mục đích
Kiểm tra API tạo nhân viên hoạt động đúng trước khi fix frontend.

## Backend API Specification

### Endpoint
```
POST /api/employees
```

### Required Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Request Body Schema

#### Required Fields
- `fullName` (string): Họ tên nhân viên
- `email` (string): Email (phải unique)
- `dateOfBirth` (string): Ngày sinh (ISO format: YYYY-MM-DD)
- `idCard` (string): CMND/CCCD (phải unique)
- `departmentId` (string): UUID của phòng ban
- `position` (string): Chức vụ
- `startDate` (string): Ngày vào làm (ISO format: YYYY-MM-DD)
- `baseSalary` (number): Lương cơ bản (>= 0)

#### Optional Fields
- `gender` (enum): 'MALE' | 'FEMALE' | 'OTHER' (NOT Vietnamese values!)
- `phone` (string): Số điện thoại
- `address` (string): Địa chỉ

### Validation Rules

1. **Age**: Nhân viên phải >= 18 tuổi và <= 100 tuổi
2. **Start Date**: 
   - Không quá 1 năm trong quá khứ
   - Không quá 6 tháng trong tương lai
3. **Email**: Phải unique trong hệ thống
4. **ID Card**: Phải unique trong hệ thống
5. **Department**: Phải tồn tại trong database
6. **Gender**: Phải là 'MALE', 'FEMALE', hoặc 'OTHER' (KHÔNG phải 'Nam', 'Nữ', 'Khác')
7. **Base Salary**: Phải >= 0

### Example Valid Request

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@company.com",
  "phone": "0901234567",
  "dateOfBirth": "1995-05-15",
  "gender": "MALE",
  "idCard": "001234567890",
  "address": "123 Test Street, Hanoi",
  "departmentId": "uuid-here",
  "position": "Software Engineer",
  "startDate": "2024-01-01",
  "baseSalary": 15000000
}
```

### Example Minimal Request

```json
{
  "fullName": "Trần Thị B",
  "email": "tranthib@company.com",
  "dateOfBirth": "1990-01-01",
  "idCard": "099999999999",
  "departmentId": "uuid-here",
  "position": "Tester",
  "startDate": "2024-01-01",
  "baseSalary": 10000000
}
```

## Testing Methods

### Method 1: Using test-create-employee.ts script

1. Mở file `apps/backend/test-create-employee.ts`
2. Thay `YOUR_JWT_TOKEN_HERE` bằng token thực
3. Chạy:
```bash
cd apps/backend
npx ts-node test-create-employee.ts
```

### Method 2: Using REST Client (VS Code extension)

1. Cài extension "REST Client" trong VS Code
2. Mở file `apps/backend/TEST-CREATE-EMPLOYEE.http`
3. Thay `YOUR_TOKEN_HERE` bằng token thực
4. Thay `REPLACE_WITH_VALID_DEPARTMENT_ID` bằng department ID thực
5. Click "Send Request" trên mỗi test case

### Method 3: Using curl

```bash
# Get departments first
curl -X GET http://localhost:3001/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create employee
curl -X POST http://localhost:3001/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Employee",
    "email": "test@company.com",
    "dateOfBirth": "1995-05-15",
    "idCard": "001234567890",
    "departmentId": "DEPARTMENT_UUID",
    "position": "Engineer",
    "startDate": "2024-01-01",
    "baseSalary": 15000000
  }'
```

## Expected Results

### Success Response (201)
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": "uuid",
    "employeeCode": "EMP001",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@company.com",
    ...
  }
}
```

### Error Responses

#### 400 - Validation Error
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "baseSalary must be a number"],
  "error": "Bad Request"
}
```

#### 409 - Conflict (Duplicate)
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

## Common Issues to Check

### Issue 1: Gender Field Mismatch
- ❌ Frontend gửi: `"gender": "Nam"`
- ✅ Backend cần: `"gender": "MALE"`

### Issue 2: baseSalary NaN
- ❌ Frontend gửi: `"baseSalary": NaN`
- ✅ Backend cần: `"baseSalary": 0` hoặc số hợp lệ

### Issue 3: Date Format
- ❌ Frontend gửi: `"dateOfBirth": "15/05/1995"`
- ✅ Backend cần: `"dateOfBirth": "1995-05-15"`

### Issue 4: Missing Required Fields
- Kiểm tra tất cả required fields có được gửi không
- Kiểm tra departmentId có hợp lệ không

## Next Steps After Backend Test

1. ✅ Nếu backend test PASS → Fix frontend để match với backend
2. ❌ Nếu backend test FAIL → Fix backend trước

## Frontend Issues Found

Dựa trên code review, các vấn đề đã tìm thấy:

1. ✅ **FIXED**: Gender values - Changed from Vietnamese to English enum
2. ✅ **FIXED**: baseSalary NaN - Added `|| 0` fallback
3. ✅ **FIXED**: Error handling - Check error.message first

## How to Get JWT Token

### Option 1: From Browser DevTools
1. Login vào frontend
2. Mở DevTools (F12)
3. Tab Application → Local Storage
4. Copy giá trị của key `token`

### Option 2: From API Response
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "your_password"
  }'
```

Copy `access_token` từ response.
