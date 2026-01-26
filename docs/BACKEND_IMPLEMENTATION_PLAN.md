# 🚀 BACKEND IMPLEMENTATION PLAN - HỆ THỐNG QUẢN LÝ NHÂN SỰ

## 📋 TỔNG QUAN

**Tech Stack:**
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- JWT Authentication
- Class Validator & Class Transformer

**Cấu trúc modules:** 10 modules chính

---

## 🎯 PHASE 1: SETUP & CORE (Tuần 1)

### 1.1. Setup Project Structure

**Tasks:**
- [x] Install dependencies (Prisma, class-validator, bcrypt, jwt)
- [x] Setup Prisma schema
- [x] Connect to Supabase
- [ ] Create folder structure
- [ ] Setup global pipes, filters, interceptors

**Folder Structure:**
```
src/
├── common/              # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/              # Configuration
│   └── database.config.ts
├── modules/             # Feature modules
│   ├── auth/
│   ├── users/
│   ├── employees/
│   ├── departments/
│   ├── contracts/
│   ├── attendances/
│   ├── leave-requests/
│   ├── payrolls/
│   ├── rewards/
│   └── disciplines/
├── prisma/              # Prisma service
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

**Commands:**
```bash
cd apps/backend

# Install dependencies
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add bcrypt class-validator class-transformer
pnpm add -D @types/bcrypt @types/passport-jwt

# Generate modules
nest g module prisma
nest g service prisma
nest g module auth
nest g module users
nest g module employees
nest g module departments
```

---

### 1.2. Prisma Service (Core)

**File:** `src/prisma/prisma.service.ts`

**Code:**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Export:** Make it global module

---

### 1.3. Global Exception Filter

**File:** `src/common/filters/http-exception.filter.ts`

**Features:**
- Catch all HTTP exceptions
- Format error response
- Log errors

---

### 1.4. Global Validation Pipe

**File:** `src/main.ts`

**Setup:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

## 🔐 PHASE 2: AUTHENTICATION MODULE (Tuần 1-2)

### 2.1. Auth Module Structure

```
auth/
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── change-password.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── strategies/
│   └── jwt.strategy.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
├── auth.controller.ts
├── auth.service.ts
└── auth.module.ts
```

### 2.2. DTOs

**login.dto.ts:**
```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**register.dto.ts:**
```typescript
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'])
  role: string;
}
```

### 2.3. Auth Service

**Methods:**
- `login(dto)` - Login và return JWT
- `register(dto)` - Tạo user mới
- `validateUser(email, password)` - Validate credentials
- `hashPassword(password)` - Hash password với bcrypt
- `comparePassword(plain, hashed)` - So sánh password
- `generateToken(user)` - Generate JWT token

### 2.4. JWT Strategy

**Setup:**
- Extract JWT from Bearer token
- Validate token
- Attach user to request

### 2.5. Guards

**JwtAuthGuard:**
- Protect routes
- Require valid JWT

**RolesGuard:**
- Check user roles
- Use with `@Roles()` decorator

### 2.6. Decorators

**@CurrentUser():**
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**@Roles():**
```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### 2.7. Auth Controller

**Endpoints:**
- `POST /auth/login` - Login
- `POST /auth/register` - Register (Admin only)
- `POST /auth/change-password` - Change password
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

---

## 👥 PHASE 3: USERS MODULE (Tuần 2)

### 3.1. Users Module Structure

```
users/
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── users.controller.ts
├── users.service.ts
└── users.module.ts
```

### 3.2. Users Service

**Methods:**
- `create(dto)` - Tạo user
- `findAll(filters)` - List users với pagination
- `findOne(id)` - Get user by ID
- `findByEmail(email)` - Get user by email
- `update(id, dto)` - Update user
- `delete(id)` - Soft delete user
- `changeRole(id, role)` - Change user role

### 3.3. Users Controller

**Endpoints:**
- `GET /users` - List users (Admin, HR)
- `GET /users/:id` - Get user detail
- `POST /users` - Create user (Admin)
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin)

**Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)`

---

## 🏢 PHASE 4: DEPARTMENTS MODULE (Tuần 2)

### 4.1. Departments Service

**Methods:**
- `create(dto)` - Tạo phòng ban
- `findAll()` - List all departments
- `findOne(id)` - Get department detail
- `update(id, dto)` - Update department
- `delete(id)` - Delete department (check employees first)
- `getOrganizationChart()` - Get tree structure
- `assignManager(deptId, managerId)` - Gán trưởng phòng

### 4.2. DTOs

```typescript
export class CreateDepartmentDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;
}
```

### 4.3. Endpoints

- `GET /departments` - List departments
- `GET /departments/tree` - Organization chart
- `GET /departments/:id` - Department detail
- `POST /departments` - Create (Admin, HR)
- `PATCH /departments/:id` - Update
- `DELETE /departments/:id` - Delete
- `PATCH /departments/:id/manager` - Assign manager

---

## 👨‍💼 PHASE 5: EMPLOYEES MODULE (Tuần 3)

### 5.1. Employees Service

**Methods:**
- `create(dto)` - Tạo nhân viên (auto generate employee_code)
- `findAll(filters)` - List với search, filter, pagination
- `findOne(id)` - Get employee detail với relations
- `update(id, dto)` - Update employee (log to history)
- `delete(id)` - Soft delete
- `uploadAvatar(id, file)` - Upload avatar to Supabase Storage
- `getHistory(id)` - Get change history
- `generateEmployeeCode()` - Generate unique code

### 5.2. DTOs

```typescript
export class CreateEmployeeDto {
  @IsString()
  fullName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender: string;

  @IsString()
  idCard: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsUUID()
  departmentId: string;

  @IsString()
  position: string;

  @IsDateString()
  startDate: string;

  @IsNumber()
  @Min(0)
  baseSalary: number;
}
```

### 5.3. Query Filters

```typescript
export class EmployeeFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

### 5.4. Endpoints

- `GET /employees` - List với filters
- `GET /employees/:id` - Detail
- `POST /employees` - Create (HR, Admin)
- `PATCH /employees/:id` - Update
- `DELETE /employees/:id` - Delete
- `POST /employees/:id/avatar` - Upload avatar
- `GET /employees/:id/history` - Change history

---

## 📝 PHASE 6: CONTRACTS MODULE (Tuần 3)

### 6.1. Contracts Service

**Methods:**
- `create(dto)` - Tạo hợp đồng
- `findAll(filters)` - List contracts
- `findByEmployee(employeeId)` - Get employee contracts
- `update(id, dto)` - Update contract
- `renew(id, dto)` - Gia hạn hợp đồng
- `terminate(id, reason)` - Chấm dứt hợp đồng
- `getExpiringContracts(days)` - Contracts sắp hết hạn
- `uploadFile(id, file)` - Upload contract file

### 6.2. Scheduled Tasks

**Cron job:** Check expiring contracts daily
```typescript
@Cron('0 9 * * *') // 9 AM daily
async checkExpiringContracts() {
  const contracts = await this.getExpiringContracts(30);
  // Send notifications
}
```

### 6.3. Endpoints

- `GET /contracts` - List
- `GET /contracts/expiring` - Expiring contracts
- `GET /contracts/employee/:employeeId` - By employee
- `POST /contracts` - Create
- `PATCH /contracts/:id` - Update
- `POST /contracts/:id/renew` - Renew
- `POST /contracts/:id/terminate` - Terminate
- `POST /contracts/:id/file` - Upload file

---

## ⏰ PHASE 7: ATTENDANCES MODULE (Tuần 4)

### 7.1. Attendances Service

**Methods:**
- `checkIn(employeeId)` - Check in
- `checkOut(employeeId)` - Check out
- `getTodayAttendance(employeeId)` - Get today record
- `getMonthlyReport(employeeId, month, year)` - Monthly report
- `calculateWorkHours(checkIn, checkOut)` - Calculate hours
- `checkLate(checkIn)` - Check if late
- `checkEarlyLeave(checkOut)` - Check if early leave

### 7.2. Business Logic

```typescript
// Check-in logic
- Check if already checked in today
- Record check-in time
- Check if late (after 8:30 AM)
- Auto-create attendance record

// Check-out logic
- Check if checked in
- Record check-out time
- Calculate work hours
- Check if early leave (before 5:00 PM)
```

### 7.3. Endpoints

- `POST /attendances/check-in` - Check in
- `POST /attendances/check-out` - Check out
- `GET /attendances/today` - Today attendance
- `GET /attendances/employee/:id` - Employee attendances
- `GET /attendances/report/:id/:month/:year` - Monthly report
- `GET /attendances/statistics` - Statistics (HR, Admin)

---

## 🏖️ PHASE 8: LEAVE REQUESTS MODULE (Tuần 4)

### 8.1. Leave Requests Service

**Methods:**
- `create(dto)` - Tạo đơn xin nghỉ
- `findAll(filters)` - List requests
- `findByEmployee(employeeId)` - Employee requests
- `findPending()` - Pending requests (for managers)
- `approve(id, approverId)` - Approve request
- `reject(id, approverId, reason)` - Reject request
- `cancel(id)` - Cancel request
- `calculateTotalDays(start, end)` - Calculate days

### 8.2. Notification Logic

```typescript
// When request created
- Send notification to manager
- Send email to manager

// When approved/rejected
- Send notification to employee
- Send email to employee
- Update attendance records if approved
```

### 8.3. Endpoints

- `GET /leave-requests` - List
- `GET /leave-requests/pending` - Pending (Manager)
- `GET /leave-requests/employee/:id` - By employee
- `POST /leave-requests` - Create
- `PATCH /leave-requests/:id/approve` - Approve (Manager)
- `PATCH /leave-requests/:id/reject` - Reject (Manager)
- `DELETE /leave-requests/:id` - Cancel

---

## 💰 PHASE 9: PAYROLLS MODULE (Tuần 5-6)

### 9.1. Payrolls Service

**Methods:**
- `createPayroll(month, year)` - Tạo bảng lương tháng
- `calculateSalary(employeeId, month, year)` - Tính lương 1 người
- `calculateAllSalaries(month, year)` - Tính lương tất cả
- `updatePayrollItem(itemId, dto)` - Điều chỉnh lương
- `finalizePayroll(payrollId)` - Chốt bảng lương
- `getPayslip(employeeId, month, year)` - Phiếu lương
- `exportPayroll(payrollId, format)` - Export Excel/PDF

### 9.2. Salary Calculation Logic

```typescript
// Formula
netSalary = 
  baseSalary * (actualWorkDays / workDays)
  + allowances
  + bonus (from rewards)
  - deduction (from disciplines)
  + overtimePay
  - insurance (10.5%)
  - tax (progressive)

// Tax calculation (simplified)
taxableIncome = grossSalary - insurance - 11,000,000
if (taxableIncome <= 5,000,000) tax = taxableIncome * 0.05
else if (taxableIncome <= 10,000,000) tax = ...
// etc.
```

### 9.3. Endpoints

- `GET /payrolls` - List payrolls
- `GET /payrolls/:id` - Payroll detail
- `POST /payrolls` - Create payroll (HR, Admin)
- `PATCH /payrolls/:id/items/:itemId` - Update item
- `POST /payrolls/:id/finalize` - Finalize
- `GET /payrolls/:id/export` - Export
- `GET /payslips/:employeeId/:month/:year` - Payslip

---

## 🎁 PHASE 10: REWARDS & DISCIPLINES (Tuần 6)

### 10.1. Rewards Service

**Methods:**
- `create(dto)` - Tạo khen thưởng
- `findAll(filters)` - List rewards
- `findByEmployee(employeeId)` - Employee rewards
- `delete(id)` - Delete reward

### 10.2. Disciplines Service

**Methods:**
- `create(dto)` - Tạo kỷ luật
- `findAll(filters)` - List disciplines
- `findByEmployee(employeeId)` - Employee disciplines
- `delete(id)` - Delete discipline

### 10.3. Endpoints

**Rewards:**
- `GET /rewards` - List
- `GET /rewards/employee/:id` - By employee
- `POST /rewards` - Create (Manager, HR, Admin)
- `DELETE /rewards/:id` - Delete

**Disciplines:**
- `GET /disciplines` - List
- `GET /disciplines/employee/:id` - By employee
- `POST /disciplines` - Create (Manager, HR, Admin)
- `DELETE /disciplines/:id` - Delete

---

## 📊 PHASE 11: REPORTS & STATISTICS (Tuần 7)

### 11.1. Reports Service

**Methods:**
- `getEmployeeOverview()` - Tổng quan nhân sự
- `getAttendanceReport(month, year)` - Báo cáo chấm công
- `getPayrollReport(month, year)` - Báo cáo lương
- `getDepartmentReport()` - Báo cáo theo phòng ban
- `getContractExpiryReport()` - Hợp đồng sắp hết hạn
- `exportReport(type, filters, format)` - Export báo cáo

### 11.2. Statistics Queries

```typescript
// Employee overview
- Total employees
- Active/Inactive count
- By department
- By gender
- By age group
- Average salary

// Attendance statistics
- Total work days
- Average attendance rate
- Late count
- Early leave count

// Payroll statistics
- Total payroll amount
- Average salary
- By department
- Salary distribution
```

### 11.3. Endpoints

- `GET /reports/employee-overview` - Employee stats
- `GET /reports/attendance` - Attendance report
- `GET /reports/payroll` - Payroll report
- `GET /reports/departments` - Department report
- `GET /reports/contracts-expiring` - Expiring contracts
- `GET /reports/export` - Export report

---

## 🔧 PHASE 12: UTILITIES & OPTIMIZATION (Tuần 7-8)

### 12.1. Audit Logging

**Interceptor:** Log all important actions
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Log action to audit_logs table
  }
}
```

### 12.2. Employee History Tracking

**Interceptor:** Track employee changes
```typescript
// Before update
const oldEmployee = await this.findOne(id);

// After update
await this.logHistory(id, 'field', oldValue, newValue, userId);
```

### 12.3. File Upload (Supabase Storage)

**Service:** Upload files
```typescript
async uploadFile(bucket: string, path: string, file: Buffer) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
  return data.publicUrl;
}
```

### 12.4. Caching (Optional)

**Redis cache:** Cache frequently accessed data
- Department list
- Employee list
- Reports

### 12.5. Rate Limiting

**Throttler:** Prevent abuse
```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})
```

---

## 🧪 PHASE 13: TESTING (Tuần 8)

### 13.1. Unit Tests

**Test each service:**
- Auth service
- Employees service
- Payroll calculation
- etc.

### 13.2. Integration Tests

**Test API endpoints:**
- Login flow
- CRUD operations
- Business logic

### 13.3. E2E Tests

**Test complete flows:**
- Employee lifecycle
- Payroll process
- Leave request approval

---

## 📝 CHECKLIST TỔNG HỢP

### Core Setup
- [ ] Prisma service
- [ ] Global exception filter
- [ ] Global validation pipe
- [ ] JWT authentication
- [ ] Role-based guards

### Modules (10)
- [ ] Auth module
- [ ] Users module
- [ ] Departments module
- [ ] Employees module
- [ ] Contracts module
- [ ] Attendances module
- [ ] Leave requests module
- [ ] Payrolls module
- [ ] Rewards module
- [ ] Disciplines module

### Features
- [ ] File upload (Supabase Storage)
- [ ] Audit logging
- [ ] Employee history tracking
- [ ] Email notifications
- [ ] Scheduled tasks (cron)
- [ ] Reports & statistics
- [ ] Export Excel/PDF

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

### Documentation
- [ ] API documentation (Swagger)
- [ ] README
- [ ] Deployment guide

---

## 🎯 TIMELINE SUMMARY

| Week | Phase | Modules |
|------|-------|---------|
| 1 | Setup + Auth | Core, Auth, Users |
| 2 | HR Basic | Departments, Employees (part) |
| 3 | HR Advanced | Employees (full), Contracts |
| 4 | Attendance | Attendances, Leave Requests |
| 5-6 | Payroll | Payrolls, Rewards, Disciplines |
| 7 | Reports | Reports, Statistics |
| 8 | Polish | Testing, Optimization |

---

## 📚 RESOURCES

**NestJS Docs:**
- https://docs.nestjs.com
- https://docs.nestjs.com/techniques/database
- https://docs.nestjs.com/security/authentication

**Prisma Docs:**
- https://www.prisma.io/docs

**Best Practices:**
- Use DTOs for validation
- Use guards for authorization
- Use interceptors for logging
- Use pipes for transformation
- Handle errors properly
- Write tests

---

**Tạo bởi:** Kiro AI Assistant  
**Ngày:** 15/01/2026  
**Version:** 1.0
