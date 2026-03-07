# HỆ THỐNG QUẢN LÝ NHÂN SỰ - PHẦN 4

## PHẦN 4: MODULE HỖ TRỢ & TÍNH NĂNG NÂNG CAO

### 10. MODULE DASHBOARD & BÁO CÁO

#### 10.1. Mô tả chức năng
Module cung cấp dashboard tổng quan và các báo cáo thống kê:
- Tổng quan hệ thống (overview)
- Thống kê nhân viên theo phòng ban, trạng thái
- Tổng hợp chấm công với biểu đồ xu hướng
- Tổng hợp lương theo tháng
- Cảnh báo hệ thống (alerts)
- Hoạt động gần đây (recent activities)
- Thống kê turnover (tỷ lệ nghỉ việc)
- Snapshot hôm nay

#### 10.2. Backend Endpoints

**Dashboard Controller** (`/api/dashboard`):

| Method | Endpoint | Chức năng | Query Params | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/dashboard/overview` | Tổng quan hệ thống | - | `{ totalEmployees, activeEmployees, totalDepartments, todayAttendance, pendingLeaves, expiringContracts, monthlyPayroll }` |
| GET | `/dashboard/employee-stats` | Thống kê nhân viên | - | `{ byDepartment[], byStatus[], byGender[] }` |
| GET | `/dashboard/attendance-summary` | Tổng hợp chấm công | `month, year` | `{ summary, dailyTrend[] }` |
| GET | `/dashboard/payroll-summary` | Tổng hợp lương | `year` | `{ monthlyData[], totalAmount, avgSalary }` |
| GET | `/dashboard/alerts` | Cảnh báo hệ thống | - | `{ expiringContracts[], pendingLeaves[], frequentLateEmployees[] }` |
| GET | `/dashboard/activities` | Hoạt động gần đây | `limit` (default: 10) | `{ activities[] }` |
| GET | `/dashboard/turnover-stats` | Thống kê turnover | `months` (default: 6) | `{ rate, trend[], byDepartment[] }` |
| GET | `/dashboard/today-snapshot` | Snapshot hôm nay | - | `{ workingNow, lateToday, pendingApprovals, expiringContracts }` |
| GET | `/dashboard/contract-alerts` | Cảnh báo hợp đồng | `days` (default: 60) | `{ alerts[] with severity }` |
| GET | `/dashboard/contract-alerts/expiring` | Danh sách HĐ sắp hết hạn | `days` (default: 60) | `{ contracts[] }` |

#### 10.3. Dashboard Components

**Overview Metrics**:
```typescript
{
  totalEmployees: number,
  activeEmployees: number,
  totalDepartments: number,
  todayAttendance: {
    present: number,
    absent: number,
    late: number,
    rate: number
  },
  pendingLeaves: number,
  expiringContracts: number,
  monthlyPayroll: {
    amount: number,
    status: string
  }
}
```

**Employee Statistics**:
- By Department: Pie chart phân bố nhân viên theo phòng ban
- By Status: Bar chart theo trạng thái (ACTIVE, INACTIVE, ON_LEAVE, TERMINATED)
- By Gender: Donut chart theo giới tính

**Attendance Summary**:
- Total work days, present days, absent days, late count
- Daily trend: Line chart số người có mặt mỗi ngày trong tháng
- Attendance rate: Percentage

**Payroll Summary**:
- Monthly data: Bar chart tổng lương mỗi tháng trong năm
- Total amount: Tổng chi lương năm
- Average salary: Lương trung bình

**Alerts System**:
1. **Contract Alerts** (Severity levels):
   - HIGH: Hết hạn trong 7 ngày
   - MEDIUM: Hết hạn trong 7-30 ngày
   - LOW: Hết hạn trong 30-60 ngày
   - INFO: Hết hạn trong 60-90 ngày

2. **Pending Approvals**:
   - Leave requests chờ duyệt
   - Overtime requests chờ duyệt
   - Attendance corrections chờ duyệt
   - Termination requests chờ duyệt

3. **Attendance Alerts**:
   - Frequent late employees (>3 lần/tháng)
   - Frequent absent employees
   - Incomplete attendance records

**Turnover Statistics**:
```typescript
{
  rate: number, // Tỷ lệ % nghỉ việc
  trend: [
    { month: string, joined: number, left: number, rate: number }
  ],
  byDepartment: [
    { department: string, rate: number, count: number }
  ]
}
```

#### 10.4. Frontend Integration

**Dashboard Pages**:
- `/dashboard` - Trang dashboard chính với tất cả widgets

**Dashboard Components**:
- `TodaySnapshot.tsx` - Snapshot hôm nay
- `AttendanceChart.tsx` - Biểu đồ chấm công
- `PayrollSummaryChart.tsx` - Biểu đồ lương
- `DepartmentDistribution.tsx` - Phân bố phòng ban
- `DepartmentPerformance.tsx` - Hiệu suất phòng ban
- `ContractExpirationAlerts.tsx` - Cảnh báo HĐ hết hạn
- `TerminationAlertsWidget.tsx` - Cảnh báo chấm dứt HĐ
- `CriticalAlertsHub.tsx` - Hub tất cả cảnh báo
- `RecentActivities.tsx` - Hoạt động gần đây
- `TurnoverRate.tsx` - Tỷ lệ nghỉ việc
- `AttendanceTrendChart.tsx` - Xu hướng chấm công
- `AttendanceLiveFeed.tsx` - Feed real-time check-in/out

---

### 11. MODULE LỊCH LÀM VIỆC (CALENDAR & WORK SCHEDULES)

#### 11.1. Mô tả chức năng
Module quản lý lịch làm việc cá nhân và ca làm việc:
- Xem lịch làm việc cá nhân
- Quản lý ca làm việc (shifts)
- Tạo lịch làm việc cho nhân viên
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
  * NIGHT: Ca đêm (18:00 - 22:00)
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
| GET | `/calendar/my-calendar` | Lịch làm việc của tôi | Query: `startDate, endDate` (required) | `{ schedules[], leaves[], holidays[] }` |
| GET | `/calendar/stats` | Thống kê lịch tháng | Query: `month, year` (required) | `{ totalDays, workDays, leaveDays, actualWorkDays }` |

**Schedule Management** (`/api/calendar/schedules`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/calendar/schedules` | Tạo lịch làm việc (HR) | `{ employeeId, date, shiftType, startTime, endTime, notes }` | `{ schedule }` |
| GET | `/calendar/schedules/:id` | Chi tiết lịch | - | `{ schedule }` |
| PUT | `/calendar/schedules/:id` | Cập nhật lịch (HR) | `{ shiftType, startTime, endTime, notes }` | `{ schedule }` |
| DELETE | `/calendar/schedules/:id` | Xóa lịch (HR) | - | `{ message }` |
| POST | `/calendar/schedules/bulk` | Tạo hàng loạt (HR) | `{ employeeIds[], startDate, endDate, shiftType, pattern }` | `{ created: number }` |
| GET | `/calendar/schedules/conflicts/check` | Kiểm tra xung đột | Query: `employeeId, startDate, endDate` | `{ hasConflict: boolean, conflicts[] }` |

**Holidays Management** (`/api/holidays`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/holidays` | Danh sách ngày lễ | Query: `year` | `{ holidays[] }` |
| POST | `/holidays` | Tạo ngày lễ (HR) | `{ name, date, isRecurring }` | `{ holiday }` |
| DELETE | `/holidays/:id` | Xóa ngày lễ (HR) | - | `{ message }` |

#### 11.4. Business Logic

**Calendar Integration**:
- Lịch làm việc = Work Schedules + Leave Requests + Holidays
- Hiển thị tất cả trong một calendar view
- Color coding:
  - Work day: Blue
  - Leave day: Orange
  - Holiday: Red
  - Weekend: Gray

**Shift Types**:
1. **MORNING** (8:00 - 12:00): 4 giờ
2. **AFTERNOON** (13:00 - 17:00): 4 giờ
3. **FULL_DAY** (8:00 - 17:00): 8 giờ (trừ 1h nghỉ trưa)
4. **NIGHT** (18:00 - 22:00): 4 giờ
5. **CUSTOM**: Tùy chỉnh startTime và endTime

**Bulk Schedule Creation**:
- Tạo lịch cho nhiều nhân viên cùng lúc
- Patterns:
  - WEEKDAYS: Thứ 2-6
  - ALL_DAYS: Tất cả các ngày
  - CUSTOM: Chọn ngày cụ thể

**Conflict Detection**:
- Kiểm tra overlap với schedules khác
- Kiểm tra overlap với leave requests
- Kiểm tra overlap với holidays
- Trả về danh sách conflicts để HR xử lý

**Calendar Stats**:
```typescript
{
  totalDays: number, // Tổng số ngày trong tháng
  workDays: number, // Số ngày làm việc theo lịch
  leaveDays: number, // Số ngày nghỉ phép
  holidays: number, // Số ngày lễ
  actualWorkDays: number, // Số ngày thực tế làm việc
  weekends: number // Số ngày cuối tuần
}
```

**Integration with Attendance**:
- Khi check-in, so sánh với work schedule
- Nếu không có schedule → Tạo FULL_DAY schedule tự động
- Nếu có schedule → Validate check-in time với shift

#### 11.5. Frontend Integration

**Calendar Service** (`services/calendarService.ts`):
```typescript
- getMyCalendar(startDate, endDate): Promise<CalendarData>
- getCalendarStats(month, year): Promise<CalendarStats>
- createSchedule(data): Promise<Schedule>
- updateSchedule(id, data): Promise<Schedule>
- deleteSchedule(id): Promise<void>
- bulkCreateSchedules(data): Promise<BulkResult>
- checkConflicts(employeeId, startDate, endDate): Promise<ConflictCheck>
```

**Calendar Pages**:
- `/dashboard/schedules/overview` - Tổng quan lịch làm việc
- `/dashboard/schedules/shifts` - Quản lý ca làm việc
- `/dashboard/schedules/holidays` - Quản lý ngày lễ

**Calendar Components**:
- `WorkCalendar.tsx` - Calendar view với events
- `ShiftManager.tsx` - Quản lý ca làm việc
- `BulkScheduleCreator.tsx` - Tạo lịch hàng loạt
- `ConflictChecker.tsx` - Kiểm tra xung đột

---

### 12. MODULE THÔNG BÁO (NOTIFICATIONS)

#### 12.1. Mô tả chức năng
Module quản lý thông báo real-time cho người dùng:
- Thông báo trong app
- Đánh dấu đã đọc/chưa đọc
- Xóa thông báo
- Đếm số thông báo chưa đọc
- Tự động tạo thông báo khi có sự kiện

#### 12.2. Database Models

**Notification Model** (`notifications` table):
```prisma
- id: UUID (primary key)
- userId: UUID - Người nhận
- title: String - Tiêu đề
- message: String - Nội dung
- type: String - Loại thông báo
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

| Method | Endpoint | Chức năng | Query/Body | Response |
|--------|----------|-----------|------------|----------|
| GET | `/notifications` | Danh sách thông báo | Query: `unreadOnly` (boolean) | `{ notifications[] }` |
| GET | `/notifications/unread-count` | Số thông báo chưa đọc | - | `{ count: number }` |
| POST | `/notifications/:id/read` | Đánh dấu đã đọc | - | `{ notification }` |
| POST | `/notifications/read-all` | Đánh dấu tất cả đã đọc | - | `{ count: number }` |
| DELETE | `/notifications/:id` | Xóa thông báo | - | `{ message }` |
| DELETE | `/notifications` | Xóa tất cả | - | `{ count: number }` |
| POST | `/notifications` | Tạo thông báo (Admin) | `{ userId, title, message, type, link }` | `{ notification }` |

#### 12.4. Notification Triggers

**Automatic Notification Creation**:

1. **Leave Request Events**:
   - Created → Notify manager: "New leave request from {employee}"
   - Approved → Notify employee: "Your leave request has been approved"
   - Rejected → Notify employee: "Your leave request has been rejected"

2. **Overtime Request Events**:
   - Created → Notify manager: "New overtime request from {employee}"
   - Approved → Notify employee: "Your overtime request has been approved"
   - Rejected → Notify employee: "Your overtime request has been rejected"

3. **Attendance Correction Events**:
   - Created → Notify manager: "New attendance correction from {employee}"
   - Approved → Notify employee: "Your attendance correction has been approved"
   - Rejected → Notify employee: "Your attendance correction has been rejected"

4. **Contract Events**:
   - Expiring soon (30 days) → Notify HR: "Contract expiring for {employee}"
   - Termination request created → Notify HR: "New termination request"
   - Termination approved → Notify employee: "Your contract termination has been approved"

5. **Payroll Events**:
   - Payroll created → Notify all employees: "Payroll for {month} is ready"
   - Payroll approved → Notify HR: "Payroll has been approved"

6. **Department Change Events**:
   - Change request created → Notify admin: "New department change request"
   - Change approved → Notify requester: "Department change has been approved"

7. **Manager Transition Events**:
   - Transition started → Notify old & new manager: "Manager transition initiated"
   - Task completed → Notify both: "Handover task completed"

#### 12.5. Notification Service Methods

```typescript
class NotificationsService {
  // Create notification
  async create(dto: CreateNotificationDto): Promise<Notification>
  
  // Find user notifications
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
  
  // Helper: Notify user
  async notifyUser(userId: string, title: string, message: string, type: string, link?: string): Promise<void>
  
  // Helper: Notify multiple users
  async notifyUsers(userIds: string[], title: string, message: string, type: string, link?: string): Promise<void>
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
- `NotificationBell.tsx` - Icon với badge số thông báo chưa đọc
- `NotificationDropdown.tsx` - Dropdown hiển thị thông báo
- `NotificationList.tsx` - Danh sách thông báo
- `NotificationItem.tsx` - Item thông báo với action buttons

**Real-time Updates** (Optional):
- WebSocket hoặc Server-Sent Events (SSE)
- Polling mỗi 30 giây
- React Query với refetch interval

---

### 13. MODULE CHATBOT AI (RAG - Retrieval Augmented Generation)

#### 13.1. Mô tả chức năng
Module chatbot AI nội bộ sử dụng RAG để trả lời câu hỏi về:
- Thông tin cá nhân (phép, lương, chấm công)
- Chính sách công ty
- Quy định nội bộ
- Hướng dẫn quy trình
- Câu hỏi thường gặp (FAQ)

#### 13.2. Database Models

**CompanyKnowledge Model** (`company_knowledge` table):
```prisma
- id: UUID (primary key)
- title: String - Tiêu đề
- content: String - Nội dung
- category: String - Danh mục
  * POLICY: Chính sách
  * PROCEDURE: Quy trình
  * FAQ: Câu hỏi thường gặp
  * REGULATION: Quy định
  * GUIDE: Hướng dẫn
- tags: String[] - Tags để search
- embedding: vector(384) - Vector embedding (pgvector)
- metadata: JSON (nullable) - Metadata bổ sung
- isActive: Boolean - Đang hoạt động (default: true)
- createdBy: UUID - Người tạo
- createdAt, updatedAt: DateTime
```

**ChatHistory Model** (`chat_history` table):
```prisma
- id: UUID
- employeeId: UUID - Nhân viên
- userMessage: String - Tin nhắn người dùng
- botResponse: String - Phản hồi bot
- createdAt: DateTime
```

#### 13.3. Backend Endpoints

**Chatbot Controller** (`/api/chatbot`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/chatbot/chat` | Chat với AI | `{ message, history[] }` | `{ message, sources[], context }` |
| GET | `/chatbot/history` | Lịch sử chat | Query: `limit` (default: 10) | `{ history[] }` |
| GET | `/chatbot/suggestions` | Gợi ý câu hỏi | - | `{ suggestions[] by category }` |

**Knowledge Management** (`/api/chatbot/knowledge`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/chatbot/knowledge` | Danh sách knowledge | Query: `category, search, page, limit` | `{ knowledge[], total }` |
| GET | `/chatbot/knowledge/:id` | Chi tiết knowledge | - | `{ knowledge }` |
| POST | `/chatbot/knowledge` | Tạo knowledge (Admin) | `{ title, content, category, tags }` | `{ knowledge }` |
| PATCH | `/chatbot/knowledge/:id` | Cập nhật knowledge | `{ title, content, tags, isActive }` | `{ knowledge }` |
| DELETE | `/chatbot/knowledge/:id` | Xóa knowledge | - | `{ message }` |
| POST | `/chatbot/knowledge/reindex` | Reindex embeddings | - | `{ count: number }` |

#### 13.4. RAG Architecture

**Components**:

1. **Embedding Service** (`embedding.service.ts`):
   - Sử dụng model: `all-MiniLM-L6-v2` (384 dimensions)
   - Convert text → vector embedding
   - Store trong PostgreSQL với pgvector extension

2. **LLM Service** (`llm.service.ts`):
   - Sử dụng: OpenAI GPT-4 hoặc local LLM
   - Generate response từ context
   - Streaming support (optional)

3. **Knowledge Service** (`knowledge.service.ts`):
   - CRUD operations cho knowledge base
   - Vector similarity search
   - Reindex embeddings

4. **Chatbot Service** (`chatbot.service.ts`):
   - Orchestrate RAG pipeline
   - Query personal data (leave balance, salary, attendance)
   - Combine knowledge base + personal data
   - Generate contextual response

**RAG Pipeline**:

```typescript
async chat(message: string, context: UserContext, history: ChatMessage[]) {
  // 1. Generate embedding cho user message
  const queryEmbedding = await this.embeddingService.generateEmbedding(message);
  
  // 2. Vector similarity search trong knowledge base
  const relevantKnowledge = await this.knowledgeService.searchSimilar(
    queryEmbedding,
    limit: 5,
    threshold: 0.7
  );
  
  // 3. Query personal data nếu cần
  const personalData = await this.queryPersonalData(message, context);
  
  // 4. Build context cho LLM
  const llmContext = {
    knowledge: relevantKnowledge,
    personalData: personalData,
    history: history.slice(-5), // Last 5 messages
    userRole: context.role
  };
  
  // 5. Generate response
  const response = await this.llmService.generateResponse(
    message,
    llmContext,
    systemPrompt
  );
  
  // 6. Save chat history
  await this.saveChatHistory(context.employeeId, message, response);
  
  return {
    message: response,
    sources: relevantKnowledge.map(k => k.title),
    context: llmContext
  };
}
```

**Personal Data Queries**:

Chatbot có thể query real-time data:
- Leave balance: "Tôi còn bao nhiêu ngày phép?"
- Attendance: "Chấm công tháng này của tôi thế nào?"
- Salary: "Lương tháng trước của tôi bao nhiêu?"
- Overtime: "Tôi đã tăng ca bao nhiêu giờ?"
- Leave requests: "Trạng thái đơn nghỉ phép của tôi?"

**System Prompt**:
```
Bạn là trợ lý AI nội bộ của công ty. Nhiệm vụ của bạn là:
1. Trả lời câu hỏi về chính sách, quy định công ty
2. Cung cấp thông tin cá nhân của nhân viên (phép, lương, chấm công)
3. Hướng dẫn quy trình nội bộ
4. Trả lời bằng tiếng Việt, ngắn gọn, chính xác
5. Nếu không biết, hãy thừa nhận và đề xuất liên hệ HR

Context:
{knowledge_base}
{personal_data}
{chat_history}
```

#### 13.5. Knowledge Base Management

**Categories**:
- POLICY: Chính sách nghỉ phép, lương, bảo hiểm
- PROCEDURE: Quy trình đăng ký OT, nghỉ phép, chấm công
- FAQ: Câu hỏi thường gặp
- REGULATION: Quy định giờ làm, dress code, bảo mật
- GUIDE: Hướng dẫn sử dụng hệ thống

**Example Knowledge Entries**:
```json
{
  "title": "Chính sách nghỉ phép năm",
  "content": "Nhân viên được hưởng 12 ngày phép năm. Phép tích lũy 1 ngày/tháng. Có thể chuyển tối đa 5 ngày sang năm sau...",
  "category": "POLICY",
  "tags": ["phép năm", "nghỉ phép", "leave"]
}
```

**Reindexing**:
- Trigger khi thêm/sửa knowledge
- Batch reindex tất cả knowledge
- Update embeddings trong database

#### 13.6. Frontend Integration

**Chatbot Service** (`services/chatbotService.ts`):
```typescript
- chat(message, history): Promise<ChatResponse>
- getChatHistory(limit): Promise<ChatMessage[]>
- getSuggestions(): Promise<Suggestions[]>
```

**Chatbot Components**:
- `ChatWidget.tsx` - Widget chat floating
- `ChatWindow.tsx` - Cửa sổ chat
- `ChatMessage.tsx` - Message bubble
- `ChatInput.tsx` - Input với suggestions
- `SuggestionChips.tsx` - Chips gợi ý câu hỏi

**Suggested Questions**:
- Phép năm: "Tôi còn bao nhiêu ngày phép?"
- Chấm công: "Chấm công tháng này của tôi thế nào?"
- Lương: "Lương tháng này của tôi bao nhiêu?"
- Tăng ca: "Quy định về tăng ca?"
- Chính sách: "Chính sách nghỉ phép?"

---

### 14. MODULE NHẬN DIỆN KHUÔN MẶT (FACE RECOGNITION)

#### 14.1. Mô tả chức năng
Module nhận diện khuôn mặt cho chấm công:
- Đăng ký khuôn mặt nhân viên
- Check-in/Check-out bằng khuôn mặt
- Lưu trữ face descriptors (128-dim vectors)
- So sánh và xác thực khuôn mặt
- Tích hợp với attendance module

#### 14.2. Database Models

**FaceDescriptor Model** (`face_descriptors` table):
```prisma
- id: UUID (primary key)
- employeeId: UUID - Nhân viên
- descriptor: Float[] - Vector 128 chiều (face embedding)
- imageUrl: String (nullable) - URL ảnh gốc
- quality: Float - Độ tin cậy (0-1)
- createdAt, updatedAt: DateTime
```

#### 14.3. Backend Endpoints

**Face Recognition Controller** (`/api/face-recognition`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/face-recognition/register` | Đăng ký khuôn mặt | FormData: `employeeId, image` | `{ descriptor, quality }` |
| POST | `/face-recognition/check-in` | Check-in bằng face | FormData: `image` | `{ employee, attendance }` |
| POST | `/face-recognition/check-out` | Check-out bằng face | FormData: `image` | `{ employee, attendance }` |
| GET | `/face-recognition/descriptors/:employeeId` | Lấy descriptors của NV | - | `{ descriptors[] }` |
| DELETE | `/face-recognition/descriptors/:id` | Xóa descriptor | - | `{ message }` |

#### 14.4. Face Recognition Technology

**Library**: `face-api.js` (TensorFlow.js)

**Models Used**:
1. **SSD MobileNet V1**: Face detection
2. **FaceLandmark68Net**: Landmark detection (68 points)
3. **FaceRecognitionNet**: Face embedding (128-dim descriptor)

**Face Registration Process**:
```typescript
async registerFace(employeeId: string, imageBuffer: Buffer) {
  // 1. Load image
  const img = await canvas.loadImage(imageBuffer);
  
  // 2. Detect face
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detection) {
    throw new Error('No face detected');
  }
  
  // 3. Extract descriptor (128-dim vector)
  const descriptor = Array.from(detection.descriptor);
  
  // 4. Calculate quality score
  const quality = detection.detection.score;
  
  if (quality < 0.7) {
    throw new Error('Face quality too low');
  }
  
  // 5. Save to database
  const faceDescriptor = await this.prisma.faceDescriptor.create({
    data: {
      employeeId,
      descriptor,
      quality,
      imageUrl: uploadedImageUrl
    }
  });
  
  return faceDescriptor;
}
```

**Face Recognition Process**:
```typescript
async recognizeFace(imageBuffer: Buffer) {
  // 1. Detect face in input image
  const detection = await faceapi
    .detectSingleFace(imageBuffer)
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detection) {
    throw new Error('No face detected');
  }
  
  const inputDescriptor = detection.descriptor;
  
  // 2. Get all registered descriptors
  const allDescriptors = await this.prisma.faceDescriptor.findMany({
    include: { employee: true }
  });
  
  // 3. Find best match using Euclidean distance
  let bestMatch = null;
  let minDistance = Infinity;
  const THRESHOLD = 0.6; // Distance threshold
  
  for (const desc of allDescriptors) {
    const distance = this.euclideanDistance(
      inputDescriptor,
      desc.descriptor
    );
    
    if (distance < minDistance && distance < THRESHOLD) {
      minDistance = distance;
      bestMatch = desc;
    }
  }
  
  if (!bestMatch) {
    throw new Error('Face not recognized');
  }
  
  return {
    employee: bestMatch.employee,
    confidence: 1 - minDistance,
    distance: minDistance
  };
}
```

**Euclidean Distance**:
```typescript
euclideanDistance(vec1: number[], vec2: number[]): number {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2);
  }
  return Math.sqrt(sum);
}
```

#### 14.5. Face Check-in/Check-out Flow

**Check-in**:
1. User uploads face image
2. System detects and extracts face descriptor
3. Compare với tất cả descriptors trong DB
4. Nếu match (distance < threshold):
   - Identify employee
   - Create attendance record với checkIn time
   - Return success
5. Nếu không match:
   - Return error "Face not recognized"

**Check-out**:
- Tương tự check-in
- Update attendance record với checkOut time

#### 14.6. Quality Requirements

**Image Requirements**:
- Format: JPEG, PNG
- Min size: 640x480
- Max size: 1920x1080
- Face size: Ít nhất 100x100 pixels
- Lighting: Đủ sáng, không quá tối/sáng
- Angle: Nhìn thẳng, không nghiêng quá 30 độ

**Registration Requirements**:
- Detection score >= 0.7
- Face landmarks detected
- Clear, frontal face
- Có thể đăng ký nhiều ảnh (3-5 ảnh) để tăng accuracy

**Recognition Threshold**:
- Distance < 0.6: Match (confident)
- Distance 0.6-0.7: Uncertain (may need retry)
- Distance > 0.7: No match

#### 14.7. Security & Privacy

**Data Protection**:
- Face descriptors (vectors) không thể reverse về ảnh gốc
- Ảnh gốc có thể xóa sau khi extract descriptor
- Descriptors được encrypt trong database
- Chỉ admin/HR có quyền xem descriptors

**GDPR Compliance**:
- Nhân viên phải đồng ý trước khi đăng ký face
- Có thể yêu cầu xóa face data bất kỳ lúc nào
- Face data chỉ dùng cho chấm công, không dùng cho mục đích khác

#### 14.8. Frontend Integration

**Face Recognition Service** (`services/faceRecognitionService.ts`):
```typescript
- registerFace(employeeId, imageFile): Promise<FaceDescriptor>
- faceCheckIn(imageFile): Promise<CheckInResult>
- faceCheckOut(imageFile): Promise<CheckOutResult>
- getEmployeeDescriptors(employeeId): Promise<FaceDescriptor[]>
- deleteDescriptor(id): Promise<void>
```

**Face Recognition Components**:
- `FaceRegistration.tsx` - Component đăng ký face
- `FaceCheckIn.tsx` - Component check-in bằng face
- `WebcamCapture.tsx` - Capture ảnh từ webcam
- `FacePreview.tsx` - Preview ảnh trước khi submit

**Webcam Integration**:
- Sử dụng `react-webcam` library
- Capture ảnh từ camera
- Preview trước khi submit
- Retry nếu quality thấp

---

### 15. MODULE TEAMS (NHÓM LÀM VIỆC)

#### 15.1. Mô tả chức năng
Module quản lý nhóm làm việc (teams):
- Tạo và quản lý teams
- Phân loại teams (permanent, project, cross-functional)
- Quản lý thành viên team
- Phân bổ % công việc cho thành viên
- Team lead và roles
- Theo dõi hoạt động team

#### 15.2. Database Models

**Team Model** (`teams` table):
```prisma
- id: UUID (primary key)
- name: String - Tên team
- code: String (unique) - Mã team
- description: String (nullable) - Mô tả
- departmentId: UUID - Phòng ban
- teamLeadId: UUID (nullable) - Team lead
- type: String - Loại team
  * PERMANENT: Team cố định
  * PROJECT: Team dự án (có thời hạn)
  * CROSS_FUNCTIONAL: Team liên phòng ban
- isActive: Boolean - Đang hoạt động (default: true)
- createdAt, updatedAt: DateTime
```

**TeamMember Model** (`team_members` table):
```prisma
- id: UUID
- teamId: UUID - Team
- employeeId: UUID - Nhân viên
- role: String - Vai trò trong team
  * LEAD: Team lead
  * MEMBER: Thành viên
  * CONTRIBUTOR: Cộng tác viên
- allocationPercentage: Int - % phân bổ công việc (0-100)
- startDate: Date - Ngày bắt đầu
- endDate: Date (nullable) - Ngày kết thúc
- isActive: Boolean - Đang hoạt động (default: true)
- createdAt, updatedAt: DateTime

Unique constraint: [teamId, employeeId, startDate]
```

#### 15.3. Backend Endpoints

**Teams Controller** (`/api/teams`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/teams` | Danh sách teams | Query: `departmentId, type, isActive` | `{ teams[] }` |
| GET | `/teams/:id` | Chi tiết team | - | `{ team, members[] }` |
| POST | `/teams` | Tạo team | `{ name, code, description, departmentId, teamLeadId, type }` | `{ team }` |
| PATCH | `/teams/:id` | Cập nhật team | `{ name, description, teamLeadId, isActive }` | `{ team }` |
| DELETE | `/teams/:id` | Xóa team | - | `{ message }` |

**Team Members** (`/api/teams/:id/members`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/teams/:id/members` | Danh sách thành viên | - | `{ members[] }` |
| POST | `/teams/:id/members` | Thêm thành viên | `{ employeeId, role, allocationPercentage, startDate }` | `{ member }` |
| PATCH | `/teams/:id/members/:memberId` | Cập nhật thành viên | `{ role, allocationPercentage, endDate }` | `{ member }` |
| DELETE | `/teams/:id/members/:memberId` | Xóa thành viên | - | `{ message }` |

#### 15.4. Business Logic

**Team Types**:

1. **PERMANENT**: Team cố định
   - Thuộc 1 phòng ban
   - Không có endDate
   - Thành viên ổn định

2. **PROJECT**: Team dự án
   - Có thời hạn (startDate - endDate)
   - Có thể cross-department
   - Giải tán sau khi dự án kết thúc

3. **CROSS_FUNCTIONAL**: Team liên phòng ban
   - Thành viên từ nhiều phòng ban
   - Có thể permanent hoặc temporary
   - Phục vụ mục đích đặc biệt

**Allocation Percentage**:
- Mỗi thành viên có % phân bổ công việc
- Tổng allocation của 1 nhân viên trên tất cả teams <= 100%
- Ví dụ:
  - Team A: 60%
  - Team B: 40%
  - Total: 100%

**Team Lead**:
- Mỗi team có 1 team lead
- Team lead phải là member của team
- Team lead có quyền:
  - Thêm/xóa members
  - Phân công công việc
  - Approve timesheet (nếu có)

**Validation Rules**:
- Team code phải unique
- Team lead phải thuộc department của team (với PERMANENT)
- Allocation percentage: 0-100
- Tổng allocation của employee <= 100%
- Không thể xóa team có members active

#### 15.5. Frontend Integration

**Teams Service** (`services/teamsService.ts`):
```typescript
- getTeams(params): Promise<TeamList>
- getTeam(id): Promise<TeamDetail>
- createTeam(data): Promise<Team>
- updateTeam(id, data): Promise<Team>
- deleteTeam(id): Promise<void>
- getTeamMembers(teamId): Promise<TeamMember[]>
- addTeamMember(teamId, data): Promise<TeamMember>
- updateTeamMember(teamId, memberId, data): Promise<TeamMember>
- removeTeamMember(teamId, memberId): Promise<void>
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
- `AllocationChart.tsx` - Biểu đồ phân bổ công việc

---

### 16. MODULE EXPORT & UPLOAD

#### 16.1. Mô tả chức năng
Module hỗ trợ export dữ liệu và upload files:
- Export báo cáo ra Excel, PDF
- Upload files (documents, images)
- Quản lý storage với Supabase
- Generate reports tự động

#### 16.2. Export Service

**Export Controller** (`/api/export`):

| Method | Endpoint | Chức năng | Query Params | Response |
|--------|----------|-----------|--------------|----------|
| GET | `/export/employees` | Export danh sách NV | `format` (excel/pdf) | File download |
| GET | `/export/attendance` | Export báo cáo chấm công | `month, year, format` | File download |
| GET | `/export/payroll` | Export bảng lương | `month, year, format` | File download |
| GET | `/export/leave-requests` | Export đơn nghỉ phép | `startDate, endDate, format` | File download |
| GET | `/export/contracts` | Export danh sách HĐ | `status, format` | File download |

**Export Formats**:

1. **Excel (.xlsx)**:
   - Sử dụng library: `exceljs`
   - Multiple sheets
   - Formatting, colors, borders
   - Formulas, charts

2. **PDF (.pdf)**:
   - Sử dụng library: `pdfkit` hoặc `puppeteer`
   - Custom templates
   - Headers, footers
   - Page numbers

**Example Export Service**:
```typescript
class ExportService {
  async exportEmployeesToExcel(filters: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employees');
    
    // Headers
    worksheet.columns = [
      { header: 'Mã NV', key: 'code', width: 15 },
      { header: 'Họ tên', key: 'name', width: 30 },
      { header: 'Phòng ban', key: 'department', width: 20 },
      { header: 'Chức vụ', key: 'position', width: 20 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ];
    
    // Data
    const employees = await this.getEmployees(filters);
    employees.forEach(emp => {
      worksheet.addRow({
        code: emp.employeeCode,
        name: emp.fullName,
        department: emp.department.name,
        position: emp.position,
        status: emp.status
      });
    });
    
    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    
    return await workbook.xlsx.writeBuffer();
  }
}
```

#### 16.3. Storage Service (Supabase)

**Storage Controller** (`/api/storage`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/storage/upload` | Upload file | FormData: `file, bucket, path` | `{ url, path }` |
| DELETE | `/storage/delete` | Xóa file | `{ bucket, path }` | `{ message }` |
| GET | `/storage/url` | Get signed URL | Query: `bucket, path, expiresIn` | `{ url }` |

**Supabase Buckets**:
- `avatars`: Ảnh đại diện nhân viên
- `documents`: Tài liệu nhân viên (CV, bằng cấp, CMND)
- `contracts`: File hợp đồng scan
- `payslips`: Phiếu lương PDF
- `exports`: File export tạm thời

**Storage Service**:
```typescript
class StorageService {
  private supabase: SupabaseClient;
  
  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    path: string
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  }
  
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }
  
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) throw error;
    
    return data.signedUrl;
  }
}
```

**File Upload Flow**:
1. Frontend upload file qua FormData
2. Backend validate file (type, size)
3. Upload lên Supabase Storage
4. Lưu URL vào database
5. Return URL cho frontend

**File Validation**:
- Max size: 10MB (documents), 2MB (images)
- Allowed types:
  - Images: jpg, jpeg, png
  - Documents: pdf, doc, docx, xls, xlsx
- Virus scan (optional)

#### 16.4. Upload Module

**Upload Controller** (`/api/upload`):

| Method | Endpoint | Chức năng | Request Body | Response |
|--------|----------|-----------|--------------|----------|
| POST | `/upload/avatar` | Upload avatar | FormData: `file` | `{ url }` |
| POST | `/upload/document` | Upload document | FormData: `file, type` | `{ url, filename }` |
| POST | `/upload/contract` | Upload contract file | FormData: `file, contractId` | `{ url }` |

**Multer Configuration**:
```typescript
const multerConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
};
```

#### 16.5. Frontend Integration

**Export Service** (`services/exportService.ts`):
```typescript
- exportEmployees(format, filters): Promise<Blob>
- exportAttendance(month, year, format): Promise<Blob>
- exportPayroll(month, year, format): Promise<Blob>
- exportLeaveRequests(startDate, endDate, format): Promise<Blob>
- downloadFile(blob, filename): void
```

**Upload Service** (`services/uploadService.ts`):
```typescript
- uploadAvatar(file): Promise<string>
- uploadDocument(file, type): Promise<UploadResult>
- uploadContract(file, contractId): Promise<string>
```

**Export Components**:
- `ExportButton.tsx` - Button export với dropdown format
- `ExportModal.tsx` - Modal chọn options export

**Upload Components**:
- `FileUpload.tsx` - Component upload file generic
- `ImageUpload.tsx` - Component upload ảnh với preview
- `DragDropUpload.tsx` - Drag & drop upload

---

## KẾT LUẬN PHẦN 4

Phần 4 bao gồm các module hỗ trợ và tính năng nâng cao:

1. **Dashboard & Báo cáo**: Tổng quan hệ thống với charts và alerts
2. **Calendar & Work Schedules**: Quản lý lịch làm việc và ca làm việc
3. **Notifications**: Thông báo real-time cho người dùng
4. **Chatbot AI (RAG)**: Trợ lý AI với knowledge base và personal data
5. **Face Recognition**: Chấm công bằng nhận diện khuôn mặt
6. **Teams**: Quản lý nhóm làm việc với allocation
7. **Export & Upload**: Export báo cáo và quản lý files

Các module này tăng cường trải nghiệm người dùng và tự động hóa quy trình:
- Dashboard cung cấp overview toàn diện
- Calendar giúp quản lý thời gian
- Notifications giữ user luôn cập nhật
- Chatbot AI trả lời câu hỏi 24/7
- Face Recognition hiện đại hóa chấm công
- Teams hỗ trợ làm việc nhóm
- Export & Upload đơn giản hóa báo cáo

---

## TỔNG KẾT TOÀN BỘ HỆ THỐNG

Hệ thống quản lý nhân sự bao gồm **16 modules chính**:

**Core Modules (1-3)**:
1. Auth & Users
2. Departments
3. Employees

**Operations Modules (4-6)**:
4. Contracts
5. Attendance
6. Leave Requests

**Financial Modules (7-9)**:
7. Payroll & Salary Components
8. Overtime
9. Rewards & Disciplines

**Support Modules (10-16)**:
10. Dashboard & Reports
11. Calendar & Work Schedules
12. Notifications
13. Chatbot AI (RAG)
14. Face Recognition
15. Teams
16. Export & Upload

**Technology Stack**:
- Backend: NestJS + Prisma + PostgreSQL + pgvector
- Frontend: Next.js 14 + React + TypeScript + TailwindCSS
- Storage: Supabase Storage
- Email: Nodemailer + Handlebars
- AI: OpenAI GPT-4 + all-MiniLM-L6-v2
- Face Recognition: face-api.js (TensorFlow.js)

**Key Features**:
- Workflow phê duyệt cho tất cả requests
- Email notifications tự động
- Real-time updates
- RAG chatbot với knowledge base
- Face recognition cho chấm công
- Export báo cáo Excel/PDF
- Dashboard với charts và alerts
- Mobile-responsive UI

Hệ thống được thiết kế để quản lý toàn diện vòng đời nhân viên từ tuyển dụng đến nghỉ việc, với tự động hóa cao và tuân thủ luật lao động Việt Nam.
