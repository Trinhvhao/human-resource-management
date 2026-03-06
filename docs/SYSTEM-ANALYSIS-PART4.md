# HỆ THỐNG QUẢN LÝ NHÂN SỰ - PHẦN 4 (CUỐI)

## PHẦN 4: MODULE HỖ TRỢ & TÍNH NĂNG NÂNG CAO

### 10. MODULE DASHBOARD & BÁO CÁO

#### 10.1. Mô tả chức năng
Module dashboard tổng hợp cung cấp cái nhìn tổng quan về toàn bộ hệ thống:
- Thống kê tổng quan (employees, attendance, contracts, payroll)
- Biểu đồ và charts
- Cảnh báo quan trọng (expiring contracts, pending requests)
- Hoạt động gần đây
- Snapshot hôm nay
- Phân tích turnover rate

#### 10.2. Backend Endpoints

**Dashboard Controller** (`/api/dashboard`):

| Method | Endpoint | Chức năng | Query Params | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/dashboard/overview` | Tổng quan hệ thống | - | `{ totalEmployees, activeEmployees, attendanceRate, pendingLeaves, expiringContracts, totalPayroll }` |
| GET | `/dashboard/employee-stats` | Thống kê nhân viên | - | `{ byDepartment[], byStatus[], byGender[] }` |
| GET | `/dashboard/attendance-summary` | Tổng hợp chấm công | `month, year` | `{ summary, dailyTrend[] }` |
| GET | `/dashboard/payroll-summary` | Tổng hợp lương | `year` | `{ monthlyData[], totalAmount, avgSalary }` |
| GET | `/dashboard/alerts` | Cảnh báo hệ thống | - | `{ expiringContracts[], pendingLeaves[], frequentLateEmployees[] }` |
| GET | `/dashboard/activities` | Hoạt động gần đây | `limit` | `{ activities[] }` |
| GET | `/dashboard/turnover-stats` | Thống kê turnover | `months` | `{ rate, trend[], byDepartment[] }` |
| GET | `/dashboard/today-snapshot` | Snapshot hôm nay | - | `{ workingNow, lateToday, pendingApprovals, expiringContracts }` |
| GET | `/dashboard/contract-alerts` | Cảnh báo hợp đồng | `days` | `{ alerts[] with severity }` |
| GET | `/dashboard/contract-alerts/expiring` | Danh sách HĐ sắp hết hạn | `days` | `{ contracts[] }` |

#### 10.3. Dashboard Widgets

**Overview Cards**:
- Total Employees (với % change)
- Active Employees
- Attendance Rate (tháng này)
- Pending Leave Requests
- Expiring Contracts (30 ngày)
- Total Payroll (tháng này)

**Charts & Visualizations**:
- Attendance Trend Chart (line chart)
- Payroll Summary Chart (bar chart)
- Department Distribution (pie chart)
- Department Performance (radar chart)
- Turnover Rate (line chart with trend)
- Employee Growth (area chart)

**Alert Widgets**:
- Contract Expiration Alerts (với severity: HIGH/MEDIUM/LOW/INFO)
- Termination Alerts
- Critical Alerts Hub
- Pending Approvals Counter

**Activity Widgets**:
- Recent Activities Timeline
- Today Snapshot (quick stats)
- Live Attendance Feed

#### 10.4. Frontend Integration

**Dashboard Service** (`services/dashboardService.ts`):
```typescript
- getOverview(): Promise<Overview>
- getEmployeeStats(): Promise<EmployeeStats>
- getAttendanceSummary(month, year): Promise<AttendanceSummary>
- getPayrollSummary(year): Promise<PayrollSummary>
- getAlerts(): Promise<Alerts>
- getRecentActivities(limit): Promise<Activity[]>
- getTurnoverStats(months): Promise<TurnoverStats>
- getTodaySnapshot(): Promise<Snapshot>
- getContractAlerts(days): Promise<ContractAlerts>
```

**Dashboard Pages**:
- `/dashboard` - Trang dashboard chính với tất cả widgets

**Dashboard Components**:
- `TodaySnapshot.tsx` - Snapshot hôm nay
- `AttendanceChart.tsx` - Biểu đồ chấm công
- `PayrollSummaryChart.tsx` - Biểu đồ lương
- `DepartmentDistribution.tsx` - Phân bố phòng ban
- `DepartmentPerformance.tsx` - Hiệu suất phòng ban
- `TurnoverRate.tsx` - Tỷ lệ nghỉ việc
- `ContractExpirationAlerts.tsx` - Cảnh báo HĐ hết hạn
- `TerminationAlertsWidget.tsx` - Cảnh báo chấm dứt HĐ
- `CriticalAlertsHub.tsx` - Hub cảnh báo quan trọng
- `RecentActivities.tsx` - Hoạt động gần đây
- `AttendanceLiveFeed.tsx` - Feed chấm công real-time
- `AttendanceTrendChart.tsx` - Xu hướng chấm công

---

### 11. MODULE LỊCH LÀM VIỆC (CALENDAR & WORK SCHEDULES)

#### 11.1. Mô tả chức năng
Module quản lý lịch làm việc cá nhân và ca làm việc:
- Lịch làm việc cá nhân của nhân viên
- Quản lý ca làm việc (shifts)
- Tạo lịch hàng loạt (bulk create)
- Kiểm tra xung đột lịch
- Thống kê lịch làm việc
- Tích hợp với attendance và leave requests

#### 11.2. Database Models

**WorkSchedule Model** (`work_schedules` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- date: Date - Ngày làm việc
- shiftType: Enum - Loại ca
  * MORNING: Ca sáng (8:00 - 12:00)
  * AFTERNOON: Ca chiều (13:00 - 17:00)
  * FULL_DAY: Ca ngày (8:00 - 17:00)
  * NIGHT: Ca tối (18:00 - 22:00)
  * CUSTOM: Ca tùy chỉnh
- startTime: DateTime - Giờ bắt đầu
- endTime: DateTime - Giờ kết thúc
- isWorkDay: Boolean - Có phải ngày làm việc (default: true)
- notes: String (nullable) - Ghi chú
- createdAt, updatedAt: DateTime
```

**Holiday Model** (`holidays` table):
```prisma
- id: UUID
- name: String - Tên ngày lễ
- date: Date - Ngày
- year: Int - Năm
- isRecurring: Boolean - Lặp lại hàng năm (default: false)
- createdAt: DateTime

Unique constraint: [date]
```

#### 11.3. Backend Endpoints

**Calendar Controller** (`/api/calendar`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/calendar/my-calendar` | Lịch của tôi | Query: `startDate, endDate` | `{ schedules[], leaves[], holidays[] }` |
| GET | `/calendar/stats` | Thống kê lịch | Query: `month, year` | `{ totalWorkDays, actualWorkDays, leaves, holidays }` |
| POST | `/calendar/schedules` | Tạo lịch làm việc (HR) | `{ employeeId, date, shiftType, startTime, endTime, notes }` | `{ schedule }` |
| GET | `/calendar/schedules/:id` | Chi tiết lịch | - | `{ schedule }` |
| PUT | `/calendar/schedules/:id` | Cập nhật lịch (HR) | `{ shiftType, startTime, endTime, notes }` | `{ schedule }` |
| DELETE | `/calendar/schedules/:id` | Xóa lịch (HR) | - | `{ message }` |
| POST | `/calendar/schedules/bulk` | Tạo lịch hàng loạt (HR) | `{ employeeIds[], startDate, endDate, shiftType, pattern }` | `{ created, skipped }` |
| GET | `/calendar/schedules/conflicts/check` | Kiểm tra xung đột | Query: `employeeId, startDate, endDate` | `{ hasConflict, conflicts[] }` |

**Holidays Controller** (`/api/holidays`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/holidays` | Danh sách ngày lễ | Query: `year` | `{ holidays[] }` |
| GET | `/holidays/:id` | Chi tiết ngày lễ | - | `{ holiday }` |
| POST | `/holidays` | Tạo ngày lễ (HR) | `{ name, date, year, isRecurring }` | `{ holiday }` |
| PUT | `/holidays/:id` | Cập nhật ngày lễ (HR) | `{ name, date, isRecurring }` | `{ holiday }` |
| DELETE | `/holidays/:id` | Xóa ngày lễ (HR) | - | `{ message }` |
| GET | `/holidays/year/:year` | Ngày lễ theo năm | - | `{ holidays[] }` |

#### 11.4. Business Logic

**Calendar Integration**:
- Lịch cá nhân = WorkSchedules + LeaveRequests + Holidays
- Khi query calendar, merge 3 nguồn dữ liệu
- Color coding:
  * Work day: Blue
  * Leave: Orange
  * Holiday: Red
  * Weekend: Gray

**Shift Types**:
1. **MORNING** (8:00 - 12:00): Ca sáng, 4 giờ
2. **AFTERNOON** (13:00 - 17:00): Ca chiều, 4 giờ
3. **FULL_DAY** (8:00 - 17:00): Ca ngày, 8 giờ (default)
4. **NIGHT** (18:00 - 22:00): Ca tối, 4 giờ
5. **CUSTOM**: Tùy chỉnh startTime và endTime

**Bulk Schedule Creation**:
```typescript
// Tạo lịch cho nhiều nhân viên trong khoảng thời gian
Input: {
  employeeIds: ['uuid1', 'uuid2'],
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  shiftType: 'FULL_DAY',
  pattern: 'WEEKDAYS' // WEEKDAYS, ALL_DAYS, CUSTOM
}

Logic:
- Loop qua từng ngày trong range
- Nếu pattern = WEEKDAYS, skip weekend
- Nếu ngày là holiday, skip
- Kiểm tra conflict với schedules hiện có
- Tạo schedule cho mỗi employee
```

**Conflict Detection**:
- Kiểm tra overlap về thời gian
- Kiểm tra overlap với leave requests
- Kiểm tra overlap với schedules khác
- Return danh sách conflicts để HR xử lý

**Work Days Calculation**:
```typescript
// Tính số ngày làm việc trong tháng
function getWorkDaysInMonth(month, year) {
  const daysInMonth = getDaysInMonth(month, year);
  const holidays = getHolidays(month, year);
  
  let workDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    
    // Skip weekend (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Skip holidays
    if (holidays.includes(date)) continue;
    
    workDays++;
  }
  
  return workDays;
}
```

**Vietnamese Holidays** (Recurring):
- 01/01: Tết Dương lịch
- 30/04: Ngày Giải phóng miền Nam
- 01/05: Ngày Quốc tế Lao động
- 02/09: Quốc khánh
- Tết Nguyên đán: 5-7 ngày (lunar calendar, not recurring)
- Giỗ Tổ Hùng Vương: 10/03 âm lịch

#### 11.5. Frontend Integration

**Calendar Service** (`services/calendarService.ts`):
```typescript
- getMyCalendar(startDate, endDate): Promise<Calendar>
- getCalendarStats(month, year): Promise<Stats>
- createSchedule(data): Promise<Schedule>
- updateSchedule(id, data): Promise<Schedule>
- deleteSchedule(id): Promise<void>
- bulkCreateSchedules(data): Promise<BulkResult>
- checkConflicts(employeeId, startDate, endDate): Promise<Conflicts>
- getHolidays(year): Promise<Holiday[]>
```

**Calendar Pages**:
- `/dashboard/schedules/overview` - Lịch cá nhân (calendar view)
- `/dashboard/schedules/shifts` - Quản lý ca làm việc (HR)
- `/dashboard/holidays` - Quản lý ngày lễ (HR)

**Calendar Components**:
- `CalendarView.tsx` - Calendar component (FullCalendar.js)
- `ShiftManager.tsx` - Quản lý ca làm việc
- `BulkScheduleForm.tsx` - Form tạo lịch hàng loạt
- `HolidayManager.tsx` - Quản lý ngày lễ

---

### 12. MODULE THÔNG BÁO (NOTIFICATIONS)

#### 12.1. Mô tả chức năng
Module quản lý thông báo real-time cho người dùng:
- Thông báo trong app
- Đánh dấu đã đọc/chưa đọc
- Xóa thông báo
- Đếm số thông báo chưa đọc
- Tự động tạo thông báo khi có sự kiện quan trọng

#### 12.2. Database Models

**Notification Model** (`notifications` table):
```prisma
- id: UUID (primary key)
- userId: UUID - Người nhận
- title: String - Tiêu đề
- message: String - Nội dung
- type: String - Loại thông báo (default: "INFO")
  * INFO: Thông tin
  * SUCCESS: Thành công
  * WARNING: Cảnh báo
  * ERROR: Lỗi
  * APPROVAL: Cần phê duyệt
  * REMINDER: Nhắc nhở
- link: String (nullable) - Link đến trang liên quan
- isRead: Boolean - Đã đọc (default: false)
- readAt: DateTime (nullable) - Thời điểm đọc
- createdAt, updatedAt: DateTime
```

#### 12.3. Backend Endpoints

**Notifications Controller** (`/api/notifications`):

| Method | Endpoint | Chức năng | Query Params | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/notifications` | Danh sách thông báo | `unreadOnly` | `{ notifications[] }` |
| GET | `/notifications/unread-count` | Số thông báo chưa đọc | - | `{ count }` |
| POST | `/notifications/:id/read` | Đánh dấu đã đọc | - | `{ notification }` |
| POST | `/notifications/read-all` | Đánh dấu tất cả đã đọc | - | `{ count }` |
| DELETE | `/notifications/:id` | Xóa thông báo | - | `{ message }` |
| DELETE | `/notifications` | Xóa tất cả thông báo | - | `{ count }` |
| POST | `/notifications` | Tạo thông báo (Admin) | `{ userId, title, message, type, link }` | `{ notification }` |

#### 12.4. Notification Triggers

**Tự động tạo thông báo khi**:

1. **Leave Request**:
   - Khi tạo: Thông báo cho manager
   - Khi approve: Thông báo cho employee
   - Khi reject: Thông báo cho employee

2. **Overtime Request**:
   - Khi tạo: Thông báo cho manager
   - Khi approve: Thông báo cho employee
   - Khi reject: Thông báo cho employee

3. **Attendance Correction**:
   - Khi tạo: Thông báo cho manager
   - Khi approve: Thông báo cho employee
   - Khi reject: Thông báo cho employee

4. **Contract**:
   - Hợp đồng sắp hết hạn (30 ngày): Thông báo cho HR và employee
   - Hợp đồng hết hạn: Thông báo cho HR và employee

5. **Payroll**:
   - Lương đã được tính: Thông báo cho employee
   - Lương đã được approve: Thông báo cho tất cả employees

6. **Department Change**:
   - Yêu cầu thay đổi: Thông báo cho reviewer
   - Yêu cầu được duyệt: Thông báo cho requester

7. **Termination Request**:
   - Yêu cầu chấm dứt HĐ: Thông báo cho approver
   - Yêu cầu được duyệt: Thông báo cho requester

#### 12.5. Notification Service Methods

```typescript
class NotificationsService {
  // Create notification
  async create(dto: CreateNotificationDto): Promise<Notification>
  
  // Find all for user
  async findAll(userId: string, unreadOnly: boolean): Promise<Notification[]>
  
  // Get unread count
  async getUnreadCount(userId: string): Promise<number>
  
  // Mark as read
  async markAsRead(id: string, userId: string): Promise<Notification>
  
  // Mark all as read
  async markAllAsRead(userId: string): Promise<number>
  
  // Delete notification
  async delete(id: string, userId: string): Promise<void>
  
  // Delete all
  async deleteAll(userId: string): Promise<number>
  
  // Helper: Create notification for leave approval
  async notifyLeaveApproval(leaveRequestId: string): Promise<void>
  
  // Helper: Create notification for contract expiry
  async notifyContractExpiry(contractId: string): Promise<void>
}
```

#### 12.6. Frontend Integration

**Notification Service** (`services/notificationService.ts`):
```typescript
- getNotifications(unreadOnly): Promise<Notification[]>
- getUnreadCount(): Promise<number>
- markAsRead(id): Promise<Notification>
- markAllAsRead(): Promise<number>
- deleteNotification(id): Promise<void>
- deleteAll(): Promise<number>
```

**Notification Components**:
- `NotificationBell.tsx` - Icon chuông với badge count
- `NotificationDropdown.tsx` - Dropdown hiển thị notifications
- `NotificationItem.tsx` - Item notification
- `NotificationCenter.tsx` - Trang notification center

**Real-time Updates** (Optional):
- WebSocket hoặc Server-Sent Events (SSE)
- Polling mỗi 30 giây
- Push notifications (PWA)

---

### 13. MODULE CHATBOT AI (RAG - Retrieval Augmented Generation)

#### 13.1. Mô tả chức năng
Module AI Chatbot hỏi đáp nội bộ công ty - Trợ lý ảo thông minh:
- Hỏi đáp bằng tiếng Việt tự nhiên
- Phân tích intent tự động
- Context-aware (biết thông tin người hỏi)
- RAG với company knowledge base
- Lịch sử chat
- Gợi ý câu hỏi

#### 13.2. Database Models

**ChatHistory Model** (`chat_history` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- userMessage: String - Câu hỏi
- botResponse: String - Câu trả lời
- createdAt: DateTime

Indexes: [employeeId], [createdAt]
```

**CompanyKnowledge Model** (`company_knowledge` table):
```prisma
- id: UUID (primary key)
- title: String - Tiêu đề
- content: String - Nội dung
- category: String - Danh mục
- tags: String[] - Tags
- embedding: vector(384) - Vector embedding (pgvector)
- metadata: JSON (nullable) - Metadata bổ sung
- isActive: Boolean - Đang hoạt động (default: true)
- createdBy: UUID - Người tạo
- createdAt, updatedAt: DateTime

Indexes: [category], [isActive], [createdAt]
```

#### 13.3. Backend Endpoints

**Chatbot Controller** (`/api/chatbot`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/chatbot/chat` | Chat với AI | `{ message, history[] }` | `{ message, intent, additionalData }` |
| GET | `/chatbot/history` | Lịch sử chat | Query: `limit` | `{ history[] }` |
| GET | `/chatbot/suggestions` | Gợi ý câu hỏi | - | `{ suggestions[] by category }` |

**Knowledge Controller** (`/api/chatbot/knowledge`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/chatbot/knowledge` | Danh sách knowledge | Query: `category, search, page, limit` | `{ knowledge[], total }` |
| GET | `/chatbot/knowledge/:id` | Chi tiết knowledge | - | `{ knowledge }` |
| POST | `/chatbot/knowledge` | Tạo knowledge (Admin) | `{ title, content, category, tags }` | `{ knowledge }` |
| PATCH | `/chatbot/knowledge/:id` | Cập nhật knowledge | `{ title, content, category, tags, isActive }` | `{ knowledge }` |
| DELETE | `/chatbot/knowledge/:id` | Xóa knowledge | - | `{ message }` |
| POST | `/chatbot/knowledge/search` | Tìm kiếm semantic | `{ query, limit }` | `{ results[] with similarity }` |

#### 13.4. Intent Detection

**Supported Intents**:

| Intent | Keywords | Example | Response Type |
|--------|----------|---------|---------------|
| LEAVE_BALANCE | phép, nghỉ phép, số ngày phép | "Tôi còn bao nhiêu phép?" | Query leave balance |
| ATTENDANCE_SUMMARY | chấm công, đi làm, công | "Chấm công tháng này?" | Query attendance |
| SALARY_INFO | lương, salary, thu nhập | "Lương tháng 12?" | Query payroll |
| OVERTIME_INFO | tăng ca, overtime, làm thêm | "Tôi tăng ca bao nhiêu giờ?" | Query overtime |
| COMPANY_POLICY | quy định, chính sách, policy | "Quy định giờ làm việc?" | RAG from knowledge base |
| EMPLOYEE_INFO | nhân viên, thông tin | "Thông tin của tôi?" | Query employee profile |
| LEAVE_REQUEST_STATUS | đơn nghỉ, đơn phép | "Trạng thái đơn phép?" | Query leave requests |
| GREETING | xin chào, hello, hi | "Xin chào!" | Greeting response |
| HELP | help, trợ giúp, giúp | "Help" | Show suggestions |

#### 13.5. RAG Implementation

**Architecture**:
```
User Question
    ↓
Intent Detection (Rule-based)
    ↓
[If COMPANY_POLICY]
    ↓
Generate Embedding (sentence-transformers)
    ↓
Vector Search in CompanyKnowledge (pgvector)
    ↓
Retrieve Top-K relevant documents
    ↓
[Optional] LLM Generation (OpenAI/Gemini)
    ↓
Format Response
    ↓
Return to User
```

**Embedding Service**:
```typescript
class EmbeddingService {
  // Generate embedding for text
  async generateEmbedding(text: string): Promise<number[]>
  
  // Search similar documents
  async searchSimilar(query: string, limit: number): Promise<Document[]>
}
```

**LLM Service** (Optional):
```typescript
class LLMService {
  // Generate response using LLM
  async generateResponse(
    query: string,
    context: string[],
    history: Message[]
  ): Promise<string>
}
```

**Knowledge Service**:
```typescript
class KnowledgeService {
  // Create knowledge with embedding
  async create(dto: CreateKnowledgeDto): Promise<Knowledge>
  
  // Search knowledge by semantic similarity
  async semanticSearch(query: string, limit: number): Promise<Knowledge[]>
  
  // Update knowledge and re-generate embedding
  async update(id: string, dto: UpdateKnowledgeDto): Promise<Knowledge>
}
```

#### 13.6. Sample Questions

**Phép năm**:
- "Tôi còn bao nhiêu ngày phép?"
- "Số dư phép năm của tôi?"
- "Phép bệnh còn bao nhiêu?"

**Chấm công**:
- "Chấm công tháng này của tôi thế nào?"
- "Tôi đi muộn bao nhiêu lần tháng này?"
- "Tổng giờ làm việc tháng 12?"

**Lương**:
- "Lương tháng này của tôi bao nhiêu?"
- "Lương tháng 12 của tôi?"
- "Thông tin lương chi tiết?"

**Tăng ca**:
- "Tôi đã tăng ca bao nhiêu giờ?"
- "Còn được tăng ca bao nhiêu giờ?"
- "Quy định về tăng ca?"

**Chính sách** (RAG):
- "Quy định về giờ làm việc?"
- "Chính sách nghỉ phép?"
- "Chính sách tăng ca?"
- "Chính sách lương?"

#### 13.7. Frontend Integration

**Chatbot Service** (`services/chatbotService.ts`):
```typescript
- chat(message, history): Promise<ChatResponse>
- getChatHistory(limit): Promise<ChatHistory[]>
- getSuggestions(): Promise<Suggestions[]>
```

**Chatbot Components**:
- `ChatInterface.tsx` - Giao diện chat chính
- `ChatBubble.tsx` - Bubble tin nhắn
- `ChatInput.tsx` - Input box với suggestions
- `QuickReplies.tsx` - Quick reply buttons
- `TypingIndicator.tsx` - Typing indicator

**UI Features**:
- Bubble chat style (user bên phải, bot bên trái)
- Markdown support cho formatting
- Quick reply buttons
- Auto-scroll to bottom
- Search history
- Clear history
- Dark mode support

#### 13.8. Technology Stack

**Embedding Model**:
- sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- 384 dimensions
- Supports Vietnamese

**Vector Database**:
- PostgreSQL with pgvector extension
- Cosine similarity search
- Index: ivfflat or hnsw

**LLM** (Optional):
- OpenAI GPT-4 / GPT-3.5-turbo
- Google Gemini Pro
- Local LLM (Llama, Mistral)

---

### 14. MODULE NHẬN DIỆN KHUÔN MẶT (FACE RECOGNITION)

#### 14.1. Mô tả chức năng
Module nhận diện khuôn mặt cho chấm công:
- Đăng ký khuôn mặt nhân viên
- Check-in/Check-out bằng khuôn mặt
- Lưu trữ face descriptors (128-dimensional vectors)
- So sánh và matching khuôn mặt
- Tích hợp với attendance module

#### 14.2. Database Models

**FaceDescriptor Model** (`face_descriptors` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- descriptor: Float[] - 128-dimensional face embedding vector
- imageUrl: String (nullable) - URL ảnh gốc
- quality: Float - Detection confidence (0-1)
- createdAt, updatedAt: DateTime

Indexes: [employeeId], [quality]
```

#### 14.3. Backend Endpoints

**Face Recognition Controller** (`/api/face-recognition`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/face-recognition/register` | Đăng ký khuôn mặt | FormData: `employeeId, image` | `{ descriptor, quality }` |
| POST | `/face-recognition/check-in` | Check-in bằng khuôn mặt | FormData: `image` | `{ employee, attendance }` |
| POST | `/face-recognition/check-out` | Check-out bằng khuôn mặt | FormData: `image` | `{ employee, attendance }` |
| GET | `/face-recognition/descriptors/:employeeId` | Lấy descriptors của nhân viên | - | `{ descriptors[] }` |
| DELETE | `/face-recognition/descriptors/:id` | Xóa descriptor | - | `{ message }` |

#### 14.4. Face Recognition Flow

**Registration Flow**:
```
1. Upload ảnh khuôn mặt
2. Detect face trong ảnh (face-api.js)
3. Extract 128-dimensional descriptor
4. Kiểm tra quality (confidence > 0.7)
5. Lưu descriptor vào database
6. Lưu ảnh lên Supabase Storage (optional)
```

**Check-in/Check-out Flow**:
```
1. Upload ảnh khuôn mặt
2. Detect face và extract descriptor
3. So sánh với tất cả descriptors trong DB
4. Tính Euclidean distance
5. Nếu distance < threshold (0.6):
   - Match found → Identify employee
   - Create attendance record
6. Nếu không match:
   - Return error "Face not recognized"
```

#### 14.5. Technology Stack

**Face Detection & Recognition**:
- face-api.js (TensorFlow.js)
- Models:
  * ssd_mobilenetv1 (face detection)
  * faceLandmark68Net (landmark detection)
  * faceRecognitionNet (descriptor extraction)

**Distance Calculation**:
```typescript
// Euclidean distance
function euclideanDistance(desc1: Float32Array, desc2: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

// Matching threshold
const MATCH_THRESHOLD = 0.6; // Lower = stricter
```

**Face Recognition Service**:
```typescript
class FaceRecognitionService {
  // Load face-api models
  async onModuleInit(): Promise<void>
  
  // Extract face descriptor from image
  async extractDescriptor(imageBuffer: Buffer): Promise<Float32Array>
  
  // Register face for employee
  async registerFace(employeeId: string, imageBuffer: Buffer): Promise<FaceDescriptor>
  
  // Find matching employee by face
  async findMatchingEmployee(imageBuffer: Buffer): Promise<Employee | null>
  
  // Check-in with face
  async faceCheckIn(imageBuffer: Buffer): Promise<Attendance>
  
  // Check-out with face
  async faceCheckOut(imageBuffer: Buffer): Promise<Attendance>
}
```

#### 14.6. Frontend Integration

**Face Recognition Service** (`services/faceRecognitionService.ts`):
```typescript
- registerFace(employeeId, imageFile): Promise<FaceDescriptor>
- faceCheckIn(imageFile): Promise<Attendance>
- faceCheckOut(imageFile): Promise<Attendance>
- getEmployeeDescriptors(employeeId): Promise<FaceDescriptor[]>
- deleteDescriptor(id): Promise<void>
```

**Face Recognition Components**:
- `FaceRegistration.tsx` - Đăng ký khuôn mặt
- `FaceCheckIn.tsx` - Check-in bằng khuôn mặt
- `WebcamCapture.tsx` - Capture ảnh từ webcam
- `FacePreview.tsx` - Preview ảnh trước khi submit

**Webcam Integration**:
```typescript
// Using react-webcam
import Webcam from 'react-webcam';

const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  
  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    // Convert to File and upload
  };
  
  return <Webcam ref={webcamRef} />;
};
```

#### 14.7. Security & Privacy

**Best Practices**:
- Lưu trữ descriptors (vectors) thay vì ảnh gốc
- Encrypt descriptors trong database
- HTTPS cho tất cả API calls
- Rate limiting để prevent brute force
- Audit log cho face recognition events
- GDPR compliance: Cho phép xóa face data

**Quality Control**:
- Chỉ accept ảnh có confidence > 0.7
- Reject ảnh mờ, tối, hoặc không rõ mặt
- Yêu cầu ít nhất 1 face descriptor per employee
- Có thể đăng ký nhiều descriptors (different angles)

---

### 15. MODULE TEAMS (NHÓM LÀM VIỆC)

#### 15.1. Mô tả chức năng
Module quản lý nhóm làm việc (teams) trong phòng ban:
- Tạo và quản lý teams
- Thêm/xóa thành viên
- Phân công vai trò trong team
- Theo dõi allocation percentage
- Hỗ trợ cross-functional teams

#### 15.2. Database Models

**Team Model** (`teams` table):
```prisma
- id: UUID (primary key)
- name: String - Tên team
- code: String (unique) - Mã team
- description: String (nullable) - Mô tả
- departmentId: UUID - Phòng ban
- teamLeadId: UUID (nullable) - Team lead
- type: String - Loại team (default: "PERMANENT")
  * PERMANENT: Team cố định
  * PROJECT: Team dự án (tạm thời)
  * CROSS_FUNCTIONAL: Team liên phòng ban
- isActive: Boolean - Đang hoạt động (default: true)
- createdAt, updatedAt: DateTime
```

**TeamMember Model** (`team_members` table):
```prisma
- id: UUID (primary key)
- teamId: UUID - Team
- employeeId: UUID - Nhân viên
- role: String - Vai trò (default: "MEMBER")
  * LEAD: Team lead
  * MEMBER: Thành viên
  * CONTRIBUTOR: Cộng tác viên
- allocationPercentage: Int - % phân bổ (0-100, default: 100)
- startDate: Date - Ngày bắt đầu (default: now)
- endDate: Date (nullable) - Ngày kết thúc
- isActive: Boolean - Đang hoạt động (default: true)
- createdAt, updatedAt: DateTime

Unique constraint: [teamId, employeeId, startDate]
```

#### 15.3. Backend Endpoints

**Teams Controller** (`/api/teams`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/teams` | Danh sách teams | Query: `departmentId` | `{ teams[] }` |
| GET | `/teams/:id` | Chi tiết team | - | `{ team, members[] }` |
| POST | `/teams` | Tạo team | `{ name, code, description, departmentId, teamLeadId, type }` | `{ team }` |
| PATCH | `/teams/:id` | Cập nhật team | `{ name, description, teamLeadId, isActive }` | `{ team }` |
| DELETE | `/teams/:id` | Xóa team | - | `{ message }` |
| POST | `/teams/:id/members` | Thêm thành viên | `{ employeeId, role, allocationPercentage, startDate, endDate }` | `{ member }` |
| PATCH | `/teams/:id/members/:memberId` | Cập nhật thành viên | `{ role, allocationPercentage, endDate, isActive }` | `{ member }` |
| DELETE | `/teams/:id/members/:memberId` | Xóa thành viên | - | `{ message }` |
| GET | `/teams/:id/statistics` | Thống kê team | - | `{ totalMembers, activeMembers, avgAllocation }` |

#### 15.4. Business Logic

**Team Types**:

1. **PERMANENT**: Team cố định
   - Thuộc 1 department
   - Thành viên full-time (100% allocation)
   - Không có endDate

2. **PROJECT**: Team dự án
   - Tạm thời cho 1 dự án
   - Có startDate và endDate
   - Thành viên có thể part-time (< 100% allocation)
   - Tự động deactivate khi hết dự án

3. **CROSS_FUNCTIONAL**: Team liên phòng ban
   - Thành viên từ nhiều departments
   - Thường là project-based
   - Allocation percentage quan trọng

**Allocation Percentage**:
- Tổng allocation của 1 employee không được vượt quá 100%
- Ví dụ:
  * Team A: 60%
  * Team B: 40%
  * Total: 100% ✓
- Validation khi add member vào team

**Team Lead**:
- Mỗi team có 1 team lead
- Team lead phải là member của team
- Có thể thay đổi team lead

**Member Lifecycle**:
- Active member: isActive = true, endDate = null
- Inactive member: isActive = false
- Ended member: endDate < today

#### 15.5. Frontend Integration

**Teams Service** (`services/teamsService.ts`):
```typescript
- getTeams(departmentId): Promise<Team[]>
- getTeam(id): Promise<TeamDetail>
- createTeam(data): Promise<Team>
- updateTeam(id, data): Promise<Team>
- deleteTeam(id): Promise<void>
- addMember(teamId, data): Promise<TeamMember>
- updateMember(teamId, memberId, data): Promise<TeamMember>
- removeMember(teamId, memberId): Promise<void>
- getTeamStatistics(id): Promise<Statistics>
```

**Teams Pages**:
- `/dashboard/teams` - Danh sách teams
- `/dashboard/teams/:id` - Chi tiết team
- `/dashboard/teams/new` - Tạo team mới

**Teams Components**:
- `TeamCard.tsx` - Card hiển thị team
- `TeamForm.tsx` - Form tạo/sửa team
- `TeamMemberList.tsx` - Danh sách thành viên
- `AddMemberModal.tsx` - Modal thêm thành viên
- `AllocationChart.tsx` - Biểu đồ phân bổ

---

### 16. MODULE EXPORT & UPLOAD

#### 16.1. Mô tả chức năng
Module hỗ trợ export dữ liệu và upload files:
- Export Excel (attendance, payroll, employees, etc.)
- Export PDF (payslips, reports)
- Upload files (documents, avatars, contracts)
- Supabase Storage integration

#### 16.2. Backend Endpoints

**Export Controller** (`/api/export`):

| Method | Endpoint | Chức năng | Query Params | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/export/attendance` | Export chấm công Excel | `month, year` | Excel file |
| GET | `/export/payroll` | Export bảng lương Excel | `month, year` | Excel file |
| GET | `/export/employees` | Export danh sách NV Excel | `departmentId, status` | Excel file |
| GET | `/export/leave-requests` | Export đơn nghỉ phép Excel | `month, year, status` | Excel file |
| GET | `/export/contracts` | Export hợp đồng Excel | `status` | Excel file |
| GET | `/export/payslip/:itemId` | Export phiếu lương PDF | - | PDF file |

**Upload Controller** (`/api/upload`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/upload/avatar` | Upload avatar | FormData: `file` | `{ url }` |
| POST | `/upload/document` | Upload document | FormData: `file, type` | `{ url, fileName, size }` |
| POST | `/upload/contract` | Upload contract file | FormData: `file` | `{ url }` |
| DELETE | `/upload/:path` | Xóa file | - | `{ message }` |

**Storage Controller** (`/api/storage`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/storage/upload` | Upload file to Supabase | FormData: `file, bucket, path` | `{ url, path }` |
| DELETE | `/storage/delete` | Xóa file từ Supabase | `{ bucket, path }` | `{ message }` |
| GET | `/storage/signed-url` | Lấy signed URL | Query: `bucket, path, expiresIn` | `{ signedUrl }` |

#### 16.3. Export Service

**Excel Export**:
```typescript
class ExportService {
  // Export attendance to Excel
  async exportAttendance(month: number, year: number): Promise<Buffer>
  
  // Export payroll to Excel
  async exportPayroll(month: number, year: number): Promise<Buffer>
  
  // Export employees to Excel
  async exportEmployees(filters: any): Promise<Buffer>
  
  // Export leave requests to Excel
  async exportLeaveRequests(filters: any): Promise<Buffer>
}
```

**PDF Export**:
```typescript
// Using puppeteer or pdfkit
async generatePayslipPDF(payrollItemId: string): Promise<Buffer> {
  const item = await getPayrollItem(payrollItemId);
  const html = renderPayslipTemplate(item);
  const pdf = await htmlToPdf(html);
  return pdf;
}
```

#### 16.4. Storage Service (Supabase)

**Supabase Storage Integration**:
```typescript
class StorageService {
  private supabase: SupabaseClient;
  
  // Upload file
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string
  ): Promise<string>
  
  // Delete file
  async deleteFile(bucket: string, path: string): Promise<void>
  
  // Get public URL
  getPublicUrl(bucket: string, path: string): string
  
  // Get signed URL (for private files)
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number
  ): Promise<string>
}
```

**Buckets**:
- `avatars`: Ảnh đại diện nhân viên
- `documents`: Tài liệu nhân viên (CMND, bằng cấp, etc.)
- `contracts`: File hợp đồng scan
- `face-images`: Ảnh khuôn mặt (optional)

#### 16.5. Frontend Integration

**Export Service** (`services/exportService.ts`):
```typescript
- exportAttendance(month, year): Promise<Blob>
- exportPayroll(month, year): Promise<Blob>
- exportEmployees(filters): Promise<Blob>
- exportPayslip(itemId): Promise<Blob>
- downloadFile(blob, filename): void
```

**Upload Service** (`services/uploadService.ts`):
```typescript
- uploadAvatar(file): Promise<string>
- uploadDocument(file, type): Promise<UploadResult>
- uploadContract(file): Promise<string>
- deleteFile(path): Promise<void>
```

**Export Components**:
- `ExportButton.tsx` - Button export với dropdown
- `ExportModal.tsx` - Modal chọn options export

**Upload Components**:
- `FileUpload.tsx` - Component upload file
- `AvatarUpload.tsx` - Upload avatar với preview
- `DocumentUpload.tsx` - Upload documents

---

## KẾT LUẬN TỔNG THỂ

Hệ thống quản lý nhân sự toàn diện với 16 modules chính:

**Core Modules** (Phần 1):
1. Auth & Users - Xác thực và phân quyền
2. Departments - Quản lý phòng ban
3. Employees - Quản lý nhân viên

**Operations Modules** (Phần 2):
4. Contracts - Quản lý hợp đồng
5. Attendance - Chấm công
6. Leave Requests - Nghỉ phép

**Financial Modules** (Phần 3):
7. Payroll & Salary Components - Lương
8. Overtime - Làm thêm giờ
9. Rewards & Disciplines - Thưởng phạt

**Support Modules** (Phần 4):
10. Dashboard - Báo cáo và thống kê
11. Calendar & Work Schedules - Lịch làm việc
12. Notifications - Thông báo
13. Chatbot AI (RAG) - Trợ lý ảo
14. Face Recognition - Nhận diện khuôn mặt
15. Teams - Nhóm làm việc
16. Export & Upload - Xuất dữ liệu và upload

**Technology Stack**:
- Backend: NestJS + Prisma + PostgreSQL + pgvector
- Frontend: Next.js 14 + React + TypeScript + TailwindCSS
- Storage: Supabase Storage
- Email: Nodemailer + Handlebars
- AI: sentence-transformers + face-api.js
- Export: ExcelJS + Puppeteer/PDFKit

**Key Features**:
- JWT Authentication với role-based access control
- Workflow phê duyệt cho các requests
- Email notifications
- Real-time updates (notifications)
- AI Chatbot với RAG
- Face recognition cho attendance
- Export Excel/PDF
- Responsive UI với dark mode
- Performance optimization với indexes

---

**Tài liệu này cung cấp cái nhìn toàn diện về hệ thống. Mỗi module có thể được phát triển và mở rộng độc lập.**
