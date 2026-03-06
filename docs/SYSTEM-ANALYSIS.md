# HỆ THỐNG QUẢN LÝ NHÂN SỰ - PHÂN TÍCH CHI TIẾT

## TỔNG QUAN HỆ THỐNG

Hệ thống quản lý nhân sự toàn diện được xây dựng trên kiến trúc:
- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + React + TypeScript + TailwindCSS
- **Database**: PostgreSQL với pgvector extension (cho RAG chatbot)
- **Storage**: Supabase Storage (cho file uploads)
- **Email**: Nodemailer với Handlebars templates

---

## PHẦN 1: MODULE CƠ BẢN (3 MODULE ĐẦU TIÊN)

### 1. MODULE XÁC THỰC & NGƯỜI DÙNG (AUTH & USERS)

#### 1.1. Mô tả chức năng
Module quản lý xác thực, phân quyền và tài khoản người dùng trong hệ thống.

#### 1.2. Database Models

**User Model** (`users` table):
```prisma
- id: UUID (primary key)
- email: String (unique) - Email đăng nhập
- passwordHash: String - Mật khẩu đã hash
- role: String - Vai trò (ADMIN, HR, MANAGER, EMPLOYEE)
- employeeId: UUID (nullable) - Liên kết với nhân viên
- isActive: Boolean - Trạng thái hoạt động
- isEmailVerified: Boolean - Trạng thái xác thực email
- emailVerificationToken: String (nullable) - Token xác thực email
- emailVerifiedAt: DateTime (nullable) - Thời điểm xác thực
- createdAt, updatedAt: DateTime
```

**Relationships**:
- 1-1 với Employee (một user có thể là một nhân viên)
- 1-N với nhiều bảng khác (audit logs, notifications, activities...)

#### 1.3. Backend Endpoints

**Auth Controller** (`/api/auth`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/auth/register` | Đăng ký tài khoản mới | `{ email, password, role }` | `{ user, accessToken }` |
| POST | `/auth/login` | Đăng nhập | `{ email, password }` | `{ user, accessToken }` |
| POST | `/auth/logout` | Đăng xuất | - | `{ message }` |
| GET | `/auth/profile` | Lấy thông tin user hiện tại | - | `{ user }` |
| POST | `/auth/verify-email` | Xác thực email | `{ token }` | `{ message }` |
| POST | `/auth/resend-verification` | Gửi lại email xác thực | `{ email }` | `{ message }` |
| POST | `/auth/forgot-password` | Quên mật khẩu | `{ email }` | `{ message }` |
| POST | `/auth/reset-password` | Đặt lại mật khẩu | `{ token, newPassword }` | `{ message }` |
| PATCH | `/auth/change-password` | Đổi mật khẩu | `{ oldPassword, newPassword }` | `{ message }` |

**Users Controller** (`/api/users`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/users` | Lấy danh sách users | Query: `page, limit, role, isActive` | `{ users[], total, page, limit }` |
| GET | `/users/:id` | Lấy chi tiết user | - | `{ user }` |
| POST | `/users` | Tạo user mới | `{ email, password, role, employeeId }` | `{ user }` |
| PATCH | `/users/:id` | Cập nhật user | `{ email, role, isActive }` | `{ user }` |
| DELETE | `/users/:id` | Xóa user | - | `{ message }` |
| PATCH | `/users/:id/activate` | Kích hoạt user | - | `{ user }` |
| PATCH | `/users/:id/deactivate` | Vô hiệu hóa user | - | `{ user }` |

#### 1.4. Authentication Strategy

**JWT Strategy**:
- Access Token: Thời hạn 1 ngày
- Refresh Token: Thời hạn 7 ngày (nếu implement)
- Payload: `{ userId, email, role }`

**Guards**:
- `JwtAuthGuard`: Bảo vệ các route cần xác thực
- `RolesGuard`: Kiểm tra quyền truy cập theo role
- Decorators: `@Public()`, `@Roles('ADMIN', 'HR')`

#### 1.5. Email Verification Flow

1. User đăng ký → Tạo `emailVerificationToken`
2. Gửi email với link xác thực (template: `email-verification.hbs`)
3. User click link → Verify token → Set `isEmailVerified = true`
4. Có thể resend verification email nếu cần

#### 1.6. Frontend Integration

**Auth Service** (`services/authService.ts`):
```typescript
- login(email, password): Promise<AuthResponse>
- register(data): Promise<AuthResponse>
- logout(): Promise<void>
- getCurrentUser(): Promise<User>
- verifyEmail(token): Promise<void>
- changePassword(oldPassword, newPassword): Promise<void>
```

**Auth Pages**:
- `/login` - Trang đăng nhập
- `/register` - Trang đăng ký (nếu có)
- `/verify-email` - Trang xác thực email
- `/forgot-password` - Quên mật khẩu
- `/reset-password` - Đặt lại mật khẩu

**Auth Context/Store**:
- Lưu trữ user state
- Quản lý token trong localStorage/cookies
- Auto-refresh token
- Redirect khi chưa đăng nhập

---

### 2. MODULE PHÒNG BAN (DEPARTMENTS)

#### 2.1. Mô tả chức năng
Module quản lý cấu trúc tổ chức phòng ban theo mô hình cây phân cấp, bao gồm quản lý trưởng phòng, chuyển đổi quản lý, và theo dõi lịch sử thay đổi.

#### 2.2. Database Models

**Department Model** (`departments` table):
```prisma
- id: UUID (primary key)
- code: String (unique) - Mã phòng ban
- name: String - Tên phòng ban
- description: String (nullable) - Mô tả
- parentId: UUID (nullable) - Phòng ban cha (self-reference)
- managerId: UUID (nullable) - Trưởng phòng
- isActive: Boolean - Trạng thái hoạt động
- createdAt, updatedAt: DateTime
```

**DepartmentChangeRequest Model** (`department_change_requests` table):
```prisma
- id: UUID
- departmentId: UUID - Phòng ban liên quan
- requestType: String - Loại yêu cầu (MANAGER_CHANGE, PARENT_CHANGE, INFO_UPDATE)
- requestedBy: UUID - Người yêu cầu
- oldManagerId, newManagerId: UUID (nullable)
- oldParentId, newParentId: UUID (nullable)
- oldData, newData: JSON (nullable) - Dữ liệu cũ/mới
- reason: String - Lý do thay đổi
- status: String - PENDING, APPROVED, REJECTED
- reviewedBy: UUID (nullable) - Người duyệt
- reviewedAt: DateTime (nullable)
- reviewNote: String (nullable) - Ghi chú duyệt
- effectiveDate: DateTime - Ngày hiệu lực
- createdAt, updatedAt: DateTime
```

**DepartmentHistory Model** (`department_history` table):
```prisma
- id: UUID
- departmentId: UUID
- changeType: String - Loại thay đổi
- changedBy: UUID - Người thực hiện
- oldValue, newValue: JSON - Giá trị cũ/mới
- changeReason: String (nullable)
- ipAddress: String (nullable) - IP thực hiện
- userAgent: String (nullable) - User agent
- createdAt: DateTime
```

**ManagerTransition Model** (`manager_transitions` table):
```prisma
- id: UUID
- departmentId: UUID
- changeRequestId: UUID (nullable)
- oldManagerId, newManagerId: UUID
- status: String - INITIATED, IN_PROGRESS, COMPLETED, CANCELLED
- handoverTasks: JSON - Danh sách công việc bàn giao
- completedTasks: JSON - Công việc đã hoàn thành
- progressPercentage: Int - Tiến độ (0-100)
- startDate: DateTime - Ngày bắt đầu
- targetEndDate: DateTime - Ngày dự kiến kết thúc
- actualEndDate: DateTime (nullable) - Ngày thực tế kết thúc
- notes: String (nullable)
- createdAt, updatedAt: DateTime
```

#### 2.3. Backend Endpoints

**Departments Controller** (`/api/departments`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/departments` | Lấy danh sách phòng ban | Query: `page, limit, isActive, search` | `{ departments[], total }` |
| GET | `/departments/tree` | Lấy cây phòng ban | Query: `includeInactive` | `{ tree }` |
| GET | `/departments/:id` | Chi tiết phòng ban | - | `{ department }` |
| POST | `/departments` | Tạo phòng ban mới | `{ code, name, description, parentId, managerId }` | `{ department }` |
| PATCH | `/departments/:id` | Cập nhật phòng ban | `{ name, description, isActive }` | `{ department }` |
| DELETE | `/departments/:id` | Xóa phòng ban | - | `{ message }` |
| GET | `/departments/:id/employees` | Nhân viên trong phòng ban | Query: `includeSubDepartments` | `{ employees[] }` |
| GET | `/departments/:id/statistics` | Thống kê phòng ban | - | `{ stats }` |
| GET | `/departments/:id/performance` | Hiệu suất phòng ban | Query: `startDate, endDate` | `{ performance }` |

**Department Change Requests Controller** (`/api/departments/change-requests`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/departments/change-requests` | Danh sách yêu cầu thay đổi | Query: `status, departmentId` | `{ requests[] }` |
| GET | `/departments/change-requests/:id` | Chi tiết yêu cầu | - | `{ request }` |
| POST | `/departments/change-requests` | Tạo yêu cầu thay đổi | `{ departmentId, requestType, reason, newManagerId, effectiveDate }` | `{ request }` |
| PATCH | `/departments/change-requests/:id/approve` | Duyệt yêu cầu | `{ reviewNote }` | `{ request }` |
| PATCH | `/departments/change-requests/:id/reject` | Từ chối yêu cầu | `{ rejectionReason }` | `{ request }` |
| DELETE | `/departments/change-requests/:id` | Hủy yêu cầu | - | `{ message }` |

**Manager Transitions Controller** (`/api/departments/manager-transitions`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/departments/:id/transitions` | Lịch sử chuyển giao | - | `{ transitions[] }` |
| GET | `/departments/transitions/:id` | Chi tiết chuyển giao | - | `{ transition }` |
| PATCH | `/departments/transitions/:id/tasks` | Cập nhật công việc | `{ handoverTasks, completedTasks }` | `{ transition }` |
| PATCH | `/departments/transitions/:id/complete` | Hoàn thành chuyển giao | - | `{ transition }` |

#### 2.4. Business Logic

**Cây phòng ban (Tree Structure)**:
- Sử dụng `parentId` để tạo cấu trúc cây
- Recursive query để lấy toàn bộ cây
- Hỗ trợ nhiều cấp phòng ban (unlimited depth)

**Quy trình thay đổi trưởng phòng**:
1. Tạo `DepartmentChangeRequest` với `requestType = 'MANAGER_CHANGE'`
2. Người có quyền review và approve/reject
3. Khi approve → Tạo `ManagerTransition` record
4. Theo dõi tiến độ bàn giao công việc (handover tasks)
5. Khi hoàn thành → Cập nhật `managerId` trong Department
6. Ghi lại lịch sử trong `DepartmentHistory`

**Validation Rules**:
- Không thể set parentId = chính nó (circular reference)
- Không thể set parentId là con cháu của nó
- Manager phải là nhân viên trong phòng ban hoặc phòng ban cha
- Code phòng ban phải unique

#### 2.5. Frontend Integration

**Department Service** (`services/departmentService.ts`):
```typescript
- getDepartments(params): Promise<DepartmentList>
- getDepartmentTree(): Promise<DepartmentTree>
- getDepartment(id): Promise<Department>
- createDepartment(data): Promise<Department>
- updateDepartment(id, data): Promise<Department>
- deleteDepartment(id): Promise<void>
- getDepartmentEmployees(id): Promise<Employee[]>
- getDepartmentStatistics(id): Promise<Statistics>
- createChangeRequest(data): Promise<ChangeRequest>
- approveChangeRequest(id, note): Promise<ChangeRequest>
```

**Department Pages**:
- `/dashboard/departments` - Danh sách phòng ban (table/card view)
- `/dashboard/departments/tree` - Sơ đồ cây phòng ban
- `/dashboard/departments/:id` - Chi tiết phòng ban
- `/dashboard/departments/:id/edit` - Chỉnh sửa phòng ban
- `/dashboard/departments/change-requests` - Quản lý yêu cầu thay đổi
- `/dashboard/departments/change-requests/:id` - Chi tiết yêu cầu

**Department Components**:
- `DepartmentForm.tsx` - Form tạo/sửa phòng ban
- `DepartmentCardView.tsx` - Hiển thị dạng card
- `DepartmentTreeView.tsx` - Hiển thị dạng cây
- `PerformanceDashboard.tsx` - Dashboard hiệu suất phòng ban
- `ChangeRequestPanel.tsx` - Panel quản lý yêu cầu thay đổi

---

### 3. MODULE NHÂN VIÊN (EMPLOYEES)

#### 3.1. Mô tả chức năng
Module quản lý thông tin nhân viên toàn diện, bao gồm thông tin cá nhân, hồ sơ chi tiết, tài liệu, và theo dõi hoạt động.

#### 3.2. Database Models

**Employee Model** (`employees` table):
```prisma
- id: UUID (primary key)
- employeeCode: String (unique) - Mã nhân viên
- fullName: String - Họ tên
- dateOfBirth: Date - Ngày sinh
- gender: String (nullable) - Giới tính
- idCard: String (unique) - CMND/CCCD
- address: String (nullable) - Địa chỉ
- phone: String (nullable) - Số điện thoại
- email: String (unique) - Email
- avatarUrl: String (nullable) - URL ảnh đại diện
- departmentId: UUID - Phòng ban
- position: String - Chức vụ
- startDate: Date - Ngày bắt đầu làm việc
- endDate: Date (nullable) - Ngày kết thúc
- status: String - ACTIVE, INACTIVE, TERMINATED, ON_LEAVE
- baseSalary: Decimal - Lương cơ bản
- hasCompleteProfile: Boolean - Đã hoàn thiện hồ sơ
- profileLastUpdated: DateTime (nullable)
- createdAt, updatedAt: DateTime
```

**EmployeeProfile Model** (`employee_profiles` table):
```prisma
- id: UUID
- employeeId: UUID (unique, 1-1 relationship)

// Thông tin cá nhân
- placeOfBirth: String - Nơi sinh
- nationality: String - Quốc tịch (default: "Việt Nam")
- ethnicity: String - Dân tộc
- religion: String - Tôn giáo
- maritalStatus: String - Tình trạng hôn nhân
- numberOfChildren: Int - Số con

// Địa chỉ chi tiết
- permanentAddress: String - Địa chỉ thường trú
- temporaryAddress: String - Địa chỉ tạm trú
- passportNumber: String - Số hộ chiếu
- passportExpiry: Date - Ngày hết hạn hộ chiếu

// Liên hệ khẩn cấp
- emergencyContactName: String
- emergencyContactRelationship: String
- emergencyContactPhone: String
- emergencyContactAddress: String

// Học vấn
- highestEducation: String - Trình độ học vấn cao nhất
- major: String - Chuyên ngành
- university: String - Trường đại học
- graduationYear: Int - Năm tốt nghiệp
- professionalCertificates: String - Chứng chỉ nghề nghiệp

// Thông tin ngân hàng
- bankName: String
- bankAccountNumber: String
- bankAccountHolderName: String
- bankBranch: String - Chi nhánh

// Bảo hiểm & Thuế
- taxCode: String - Mã số thuế
- socialInsuranceNumber: String - Số BHXH
- healthInsuranceNumber: String - Số BHYT
- dependents: Int - Số người phụ thuộc

// Kinh nghiệm làm việc (trước khi vào công ty)
- workExperience: JSON

// Metadata
- profileCompletionPercentage: Int - % hoàn thiện hồ sơ
- lastProfileUpdate: DateTime
- createdAt, updatedAt: DateTime
```

**EmployeeDocument Model** (`employee_documents` table):
```prisma
- id: UUID
- employeeId: UUID
- documentType: String - RESUME, ID_CARD, DEGREE, CERTIFICATE, CONTRACT, OTHER
- fileName: String - Tên file
- fileUrl: String - URL file (Supabase Storage)
- fileSize: BigInt - Kích thước file
- mimeType: String - Loại file
- description: String (nullable) - Mô tả
- uploadedAt: DateTime - Thời gian upload
- uploadedBy: UUID - Người upload
- createdAt, updatedAt: DateTime
```

**EmployeeActivity Model** (`employee_activities` table):
```prisma
- id: UUID
- employeeId: UUID
- activityType: String - profile_update, attendance, leave_request, contract, salary, etc.
- action: String - created, updated, approved, rejected, deleted
- description: String - Mô tả hoạt động
- oldValue: JSON (nullable) - Giá trị cũ
- newValue: JSON (nullable) - Giá trị mới
- metadata: JSON (nullable) - Dữ liệu bổ sung
- performedBy: UUID (nullable) - Người thực hiện
- createdAt: DateTime
```

#### 3.3. Backend Endpoints

**Employees Controller** (`/api/employees`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/employees` | Danh sách nhân viên | Query: `page, limit, departmentId, status, search` | `{ employees[], total }` |
| GET | `/employees/:id` | Chi tiết nhân viên | - | `{ employee }` |
| POST | `/employees` | Tạo nhân viên mới | `{ employeeCode, fullName, dateOfBirth, email, departmentId, position, startDate, baseSalary }` | `{ employee }` |
| PATCH | `/employees/:id` | Cập nhật thông tin cơ bản | `{ fullName, phone, address, position, departmentId }` | `{ employee }` |
| DELETE | `/employees/:id` | Xóa nhân viên | - | `{ message }` |
| GET | `/employees/:id/profile` | Lấy hồ sơ chi tiết | - | `{ profile }` |
| PATCH | `/employees/:id/profile` | Cập nhật hồ sơ chi tiết | `{ ...profileFields }` | `{ profile }` |
| POST | `/employees/:id/avatar` | Upload ảnh đại diện | FormData: `file` | `{ avatarUrl }` |
| GET | `/employees/:id/documents` | Danh sách tài liệu | - | `{ documents[] }` |
| POST | `/employees/:id/documents` | Upload tài liệu | FormData: `file, documentType, description` | `{ document }` |
| DELETE | `/employees/:id/documents/:docId` | Xóa tài liệu | - | `{ message }` |
| GET | `/employees/:id/activities` | Lịch sử hoạt động | Query: `page, limit, activityType` | `{ activities[], total }` |
| GET | `/employees/:id/contracts` | Hợp đồng của nhân viên | - | `{ contracts[] }` |
| GET | `/employees/:id/attendance-summary` | Tổng hợp chấm công | Query: `month, year` | `{ summary }` |
| GET | `/employees/:id/leave-balance` | Số ngày phép còn lại | Query: `year` | `{ balance }` |
| GET | `/employees/:id/payroll-history` | Lịch sử lương | Query: `year` | `{ payrolls[] }` |
| PATCH | `/employees/:id/status` | Cập nhật trạng thái | `{ status, reason }` | `{ employee }` |

#### 3.4. Business Logic

**Profile Completion Tracking**:
- Tính toán `profileCompletionPercentage` dựa trên các trường đã điền
- Các trường bắt buộc: fullName, dateOfBirth, idCard, email, phone, address
- Các trường khuyến khích: education, bank info, emergency contact
- Công thức: `(số trường đã điền / tổng số trường) * 100`

**Document Management**:
- Upload file lên Supabase Storage
- Tạo URL public hoặc signed URL
- Validate file type và size
- Tự động tạo thumbnail cho ảnh (nếu cần)

**Activity Logging**:
- Tự động log mọi thay đổi quan trọng
- Lưu trữ old/new value để có thể audit
- Hiển thị timeline hoạt động cho nhân viên

**Employee Code Generation**:
- Format: `EMP-YYYY-XXXX` (VD: EMP-2024-0001)
- Auto-increment theo năm
- Unique constraint

#### 3.5. Frontend Integration

**Employee Service** (`services/employeeService.ts`):
```typescript
- getEmployees(params): Promise<EmployeeList>
- getEmployee(id): Promise<Employee>
- createEmployee(data): Promise<Employee>
- updateEmployee(id, data): Promise<Employee>
- deleteEmployee(id): Promise<void>
- getEmployeeProfile(id): Promise<EmployeeProfile>
- updateEmployeeProfile(id, data): Promise<EmployeeProfile>
- uploadAvatar(id, file): Promise<string>
- getEmployeeDocuments(id): Promise<Document[]>
- uploadDocument(id, file, type, description): Promise<Document>
- deleteDocument(id, docId): Promise<void>
- getEmployeeActivities(id, params): Promise<ActivityList>
```

**Employee Pages**:
- `/dashboard/employees` - Danh sách nhân viên (table/card/grid view)
- `/dashboard/employees/new` - Tạo nhân viên mới
- `/dashboard/employees/:id` - Chi tiết nhân viên (tabs: Overview, Profile, Documents, Activities, Contracts, Attendance, Payroll)
- `/dashboard/employees/:id/edit` - Chỉnh sửa thông tin

**Employee Components**:
- `EmployeeForm.tsx` - Form tạo/sửa nhân viên
- `EmployeeViewSwitcher.tsx` - Chuyển đổi view (table/card/grid)
- `ProfileCompletionBar.tsx` - Thanh tiến độ hoàn thiện hồ sơ
- `AvatarUpload.tsx` - Component upload ảnh đại diện
- `AvatarUploadModal.tsx` - Modal upload ảnh
- `ActivityTimeline.tsx` - Timeline hoạt động
- `DocumentList.tsx` - Danh sách tài liệu

---

## KẾT LUẬN PHẦN 1

Ba module cơ bản này tạo nền tảng cho toàn bộ hệ thống:
1. **Auth & Users**: Xác thực và phân quyền
2. **Departments**: Cấu trúc tổ chức
3. **Employees**: Quản lý nhân viên

Các module này có mối quan hệ chặt chẽ:
- User ↔ Employee (1-1)
- Employee → Department (N-1)
- Department → Manager/Employee (1-N)

---

**Vui lòng review phần 1 này. Nếu OK, tôi sẽ tiếp tục với 3 module tiếp theo:**
- Module Hợp đồng (Contracts)
- Module Chấm công (Attendance)
- Module Nghỉ phép (Leave Requests)
