# KẾ HOẠCH TRIỂN KHAI MODULE NHÂN VIÊN

## 🎯 MỨC ĐỘ ƯU TIÊN

### 🔴 PRIORITY 1 - CRITICAL (Triển khai ngay)
Các tính năng cần thiết cho vận hành cơ bản

### 🟡 PRIORITY 2 - HIGH (Triển khai trong 1-2 tuần)
Các tính năng quan trọng nhưng có thể hoãn

### 🟢 PRIORITY 3 - MEDIUM (Triển khai trong 1 tháng)
Các tính năng nâng cao, cải thiện trải nghiệm

### ⚪ PRIORITY 4 - LOW (Triển khai sau)
Các tính năng nice-to-have

---

## 🔴 PHASE 1: CRITICAL FEATURES (1-2 tuần)


### 1.2. Contract Management UI
**Mức độ: 🔴 CRITICAL**
**Thời gian: 3 ngày**

#### Tasks:
- [ ] Tạo Contract list page
- [ ] Tạo Contract detail page
- [ ] Tạo Contract form (create/edit)
- [ ] Contract expiry warning
- [ ] Contract renewal workflow

#### Files cần tạo:
- `apps/frontend/app/dashboard/contracts/page.tsx`
- `apps/frontend/app/dashboard/contracts/[id]/page.tsx`
- `apps/frontend/app/dashboard/contracts/new/page.tsx`
- `apps/frontend/services/contractService.ts`
- `apps/frontend/types/contract.ts`

#### Backend:
- Contract APIs đã có, chỉ cần test

---

### 1.3. Contract Expiry Alerts
**Mức độ: 🔴 CRITICAL**
**Thời gian: 2 ngày**

#### Tasks:
- [ ] Tạo background job check hợp đồng sắp hết hạn
- [ ] Email notification cho HR
- [ ] Dashboard widget hiển thị contracts sắp hết hạn
- [ ] Alert trong employee detail page

#### Files cần tạo:
- `apps/backend/src/contracts/contracts-expiry.service.ts`
- `apps/backend/src/contracts/contracts-expiry.cron.ts`
- `apps/frontend/components/dashboard/ExpiringContractsWidget.tsx`

---

### 1.4. Salary Components Management UI
**Mức độ: 🔴 CRITICAL**
**Thời gian: 2 ngày**

#### Tasks:
- [ ] UI để quản lý phụ cấp trong employee detail
- [ ] Form thêm/sửa/xóa salary components
- [ ] History của salary changes
- [ ] Validation rules

#### Files cần tạo:
- `apps/frontend/components/employees/SalaryComponentsManager.tsx`
- `apps/frontend/components/employees/SalaryComponentForm.tsx`
- Update `apps/frontend/app/dashboard/employees/[id]/page.tsx`

---

### 1.5. Basic Reporting
**Mức độ: 🔴 CRITICAL**
**Thời gian: 3 ngày**

#### Tasks:
- [ ] Báo cáo biến động nhân sự tháng/quý
- [ ] Báo cáo hợp đồng sắp hết hạn
- [ ] Báo cáo cơ cấu tổ chức
- [ ] Export to Excel

#### Files cần tạo:
- `apps/frontend/app/dashboard/reports/page.tsx`
- `apps/frontend/app/dashboard/reports/employee-changes/page.tsx`
- `apps/frontend/app/dashboard/reports/contracts/page.tsx`
- `apps/frontend/app/dashboard/reports/organization/page.tsx`
- `apps/backend/src/reports/reports.module.ts`
- `apps/backend/src/reports/reports.service.ts`
- `apps/backend/src/reports/reports.controller.ts`

---

## 🟡 PHASE 2: HIGH PRIORITY (2-3 tuần)

### 2.1. Onboarding System
**Mức độ: 🟡 HIGH**
**Thời gian: 5 ngày**

#### Database:
```prisma
model OnboardingChecklist {
  id           String   @id @default(uuid())
  employeeId   String
  mentorId     String?
  status       String   // PENDING, IN_PROGRESS, COMPLETED
  startDate    DateTime
  expectedEndDate DateTime
  actualEndDate DateTime?
  
  tasks        OnboardingTask[]
  evaluations  ProbationEvaluation[]
  
  employee     Employee @relation(...)
  mentor       Employee @relation(...)
}

model OnboardingTask {
  id              String   @id @default(uuid())
  checklistId     String
  title           String
  description     String?
  assignedTo      String?
  dueDate         DateTime?
  completedAt     DateTime?
  status          String   // PENDING, COMPLETED, SKIPPED
  order           Int
  
  checklist       OnboardingChecklist @relation(...)
}

model ProbationEvaluation {
  id              String   @id @default(uuid())
  checklistId     String
  evaluationDate  DateTime
  evaluatorId     String
  rating          Int      // 1-5
  strengths       String?
  improvements    String?
  recommendation  String   // CONTINUE, EXTEND, TERMINATE
  notes           String?
  
  checklist       OnboardingChecklist @relation(...)
  evaluator       Employee @relation(...)
}
```

#### Tasks:
- [ ] Tạo database models
- [ ] Backend APIs
- [ ] Onboarding checklist UI
- [ ] Task management UI
- [ ] Probation evaluation form
- [ ] Notification system

---

### 2.2. Offboarding System
**Mức độ: 🟡 HIGH**
**Thời gian: 5 ngày**

#### Database:
```prisma
model OffboardingProcess {
  id                String   @id @default(uuid())
  employeeId        String
  resignationDate   DateTime
  lastWorkingDate   DateTime
  reason            String
  exitInterviewDate DateTime?
  exitInterviewNotes String?
  
  status            String   // INITIATED, IN_PROGRESS, COMPLETED
  
  tasks             OffboardingTask[]
  settlements       FinalSettlement?
  
  employee          Employee @relation(...)
}

model OffboardingTask {
  id              String   @id @default(uuid())
  processId       String
  taskType        String   // ASSET_RETURN, ACCESS_REVOKE, HANDOVER, etc.
  title           String
  assignedTo      String?
  completedAt     DateTime?
  status          String
  notes           String?
  
  process         OffboardingProcess @relation(...)
}

model FinalSettlement {
  id                    String   @id @default(uuid())
  processId             String   @unique
  remainingSalary       Decimal
  unusedLeavePayment    Decimal
  bonus                 Decimal
  deductions            Decimal
  totalAmount           Decimal
  paymentDate           DateTime?
  paymentStatus         String
  
  process               OffboardingProcess @relation(...)
}
```

#### Tasks:
- [ ] Tạo database models
- [ ] Backend APIs
- [ ] Resignation workflow UI
- [ ] Exit interview form
- [ ] Asset return checklist
- [ ] Final settlement calculation
- [ ] Access revocation integration

---

### 2.3. Employee Change Workflow
**Mức độ: 🟡 HIGH**
**Thời gian: 4 ngày**

#### Database:
```prisma
model EmployeeChangeRequest {
  id              String   @id @default(uuid())
  employeeId      String
  changeType      String   // PROMOTION, DEMOTION, TRANSFER, SALARY_ADJUSTMENT
  requestedBy     String
  currentData     Json
  proposedData    Json
  reason          String
  effectiveDate   DateTime
  status          String   // PENDING, APPROVED, REJECTED
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewNotes     String?
  
  employee        Employee @relation(...)
  requester       User @relation(...)
  reviewer        User? @relation(...)
}
```

#### Tasks:
- [ ] Tạo database model
- [ ] Backend APIs
- [ ] Change request form
- [ ] Approval workflow UI
- [ ] Email notifications
- [ ] History tracking

---

### 2.4. Advanced Document Management
**Mức độ: 🟡 HIGH**
**Thời gian: 3 ngày**

#### Tasks:
- [ ] Document categories/tags
- [ ] Document expiry tracking
- [ ] Document approval workflow
- [ ] Document version control
- [ ] Bulk upload
- [ ] Document templates

#### Files cần sửa:
- Update `EmployeeDocument` model
- `apps/frontend/components/employees/DocumentManager.tsx`
- `apps/backend/src/employees/documents.service.ts`

---

## 🟢 PHASE 3: MEDIUM PRIORITY (3-4 tuần)

### 3.1. Skills Management
**Mức độ: 🟢 MEDIUM**
**Thời gian: 5 ngày**

#### Database:
```prisma
model Skill {
  id          String @id @default(uuid())
  name        String
  category    String // TECHNICAL, SOFT, LANGUAGE, CERTIFICATION
  description String?
  
  employeeSkills EmployeeSkill[]
}

model EmployeeSkill {
  id              String   @id @default(uuid())
  employeeId      String
  skillId         String
  proficiencyLevel String  // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  yearsOfExperience Int?
  lastUsed        DateTime?
  certifications  String?
  notes           String?
  
  employee        Employee @relation(...)
  skill           Skill @relation(...)
}

model Language {
  id          String @id @default(uuid())
  employeeId  String
  language    String
  proficiency String // BASIC, CONVERSATIONAL, FLUENT, NATIVE
  reading     String?
  writing     String?
  speaking    String?
  
  employee    Employee @relation(...)
}
```

#### Tasks:
- [ ] Tạo database models
- [ ] Backend APIs
- [ ] Skills management UI
- [ ] Skill matrix view
- [ ] Skill gap analysis
- [ ] Language proficiency tracking

---

### 3.2. Individual Development Plan (IDP)
**Mức độ: 🟢 MEDIUM**
**Thời gian: 5 ngày**

#### Database:
```prisma
model DevelopmentPlan {
  id              String   @id @default(uuid())
  employeeId      String
  year            Int
  careerGoal      String
  developmentAreas String
  status          String
  
  goals           DevelopmentGoal[]
  trainings       TrainingPlan[]
  
  employee        Employee @relation(...)
}

model DevelopmentGoal {
  id              String   @id @default(uuid())
  planId          String
  goal            String
  targetDate      DateTime
  status          String
  progress        Int
  notes           String?
  
  plan            DevelopmentPlan @relation(...)
}

model TrainingPlan {
  id              String   @id @default(uuid())
  planId          String
  trainingName    String
  trainingType    String
  provider        String?
  startDate       DateTime?
  endDate         DateTime?
  cost            Decimal?
  status          String
  completionDate  DateTime?
  certificate     String?
  
  plan            DevelopmentPlan @relation(...)
}
```

---

### 3.3. Performance Management
**Mức độ: 🟢 MEDIUM**
**Thời gian: 7 ngày**

#### Database:
```prisma
model PerformanceReview {
  id              String   @id @default(uuid())
  employeeId      String
  reviewerId      String
  reviewPeriod    String
  reviewDate      DateTime
  overallRating   Int
  strengths       String?
  improvements    String?
  goals           String?
  status          String
  
  ratings         PerformanceRating[]
  
  employee        Employee @relation(...)
  reviewer        Employee @relation(...)
}

model PerformanceRating {
  id              String   @id @default(uuid())
  reviewId        String
  category        String
  rating          Int
  comments        String?
  
  review          PerformanceReview @relation(...)
}
```

---

### 3.4. Advanced Analytics
**Mức độ: 🟢 MEDIUM**
**Thời gian: 5 ngày**

#### Tasks:
- [ ] Turnover rate analysis
- [ ] Demographics analysis
- [ ] Headcount forecasting
- [ ] Skill gap analysis
- [ ] Salary benchmarking
- [ ] Interactive dashboards

---

## ⚪ PHASE 4: LOW PRIORITY (Sau 1 tháng)

### 4.1. Benefits Management
- Bảo hiểm bổ sung
- Các loại trợ cấp đặc biệt
- Chế độ thai sản chi tiết
- Ngày phép đặc biệt

### 4.2. Family Information
- Thông tin chi tiết vợ/chồng
- Thông tin chi tiết con cái
- Chế độ gia đình

### 4.3. Integration
- Slack/Teams integration
- Email integration
- Calendar integration
- E-signature integration

### 4.4. Mobile App
- Mobile-friendly UI
- Native mobile app
- Push notifications

---

## 📊 TIMELINE TỔNG THỂ

```
Week 1-2:   Phase 1 - Critical Features
Week 3-5:   Phase 2 - High Priority
Week 6-9:   Phase 3 - Medium Priority
Week 10+:   Phase 4 - Low Priority
```

---

## 🎯 DELIVERABLES MỖI PHASE

### Phase 1 (Week 1-2):
- ✅ Complete employee profile
- ✅ Contract management UI
- ✅ Contract expiry alerts
- ✅ Salary components UI
- ✅ Basic reports

### Phase 2 (Week 3-5):
- ✅ Onboarding system
- ✅ Offboarding system
- ✅ Change request workflow
- ✅ Advanced document management

### Phase 3 (Week 6-9):
- ✅ Skills management
- ✅ IDP system
- ✅ Performance management
- ✅ Advanced analytics

### Phase 4 (Week 10+):
- ✅ Benefits management
- ✅ Family information
- ✅ Integrations
- ✅ Mobile app

---

## 💰 RESOURCE ESTIMATION

### Phase 1: 11 ngày = ~2 tuần
- 1 Backend Developer
- 1 Frontend Developer

### Phase 2: 17 ngày = ~3.5 tuần
- 1 Backend Developer
- 1 Frontend Developer
- 0.5 QA Engineer

### Phase 3: 22 ngày = ~4.5 tuần
- 1 Backend Developer
- 1 Frontend Developer
- 1 QA Engineer

### Phase 4: TBD
- Depends on requirements

---

## 🚀 QUICK WINS (Có thể làm ngay)

1. **Thêm CMND fields** (1 ngày) - Hoàn thiện profile
2. **Contract expiry widget** (1 ngày) - Giá trị ngay lập tức
3. **Salary components UI** (2 ngày) - Cần thiết cho payroll
4. **Basic reports** (3 ngày) - HR cần ngay

**Total: 7 ngày = 1 tuần**

---

## 📋 NEXT STEPS

1. Review và approve plan này
2. Prioritize features dựa trên business needs
3. Assign resources
4. Start với Quick Wins
5. Theo dõi progress hàng tuần

---

## 📞 SUPPORT

Nếu cần clarification hoặc có thay đổi priority, vui lòng liên hệ để adjust plan.
