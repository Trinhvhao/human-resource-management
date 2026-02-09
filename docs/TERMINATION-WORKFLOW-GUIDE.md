# Hướng Dẫn Workflow Chấm Dứt Hợp Đồng

## 📋 Tổng Quan

Workflow chấm dứt hợp đồng trong HRMS Pro được thiết kế theo quy trình phê duyệt chặt chẽ, đảm bảo tính minh bạch và tuân thủ quy định pháp luật lao động Việt Nam.

## 🔄 Quy Trình Workflow

### 1. **Tạo Yêu Cầu Chấm Dứt** (Create Termination Request)

**Người thực hiện:** Nhân viên hoặc HR

**Vị trí:** Trang chi tiết hợp đồng → Nút "Yêu cầu chấm dứt HĐ"

**Thông tin cần nhập:**
- Loại chấm dứt (Resignation, Termination, Contract End, Retirement, Other)
- Ngày thông báo (Notice Date)
- Ngày chấm dứt dự kiến (Termination Date)
- Lý do chi tiết

**Validation:**
- Hợp đồng phải ở trạng thái ACTIVE
- Không được có yêu cầu PENDING khác
- Thời gian thông báo phải tuân thủ Luật Lao động 2019:
  - Thử việc: 3 ngày
  - Có thời hạn: 30 ngày
  - Không thời hạn: 45 ngày

**Kết quả:**
- ✅ Tạo TerminationRequest với status = `PENDING_APPROVAL`
- ✅ Hiển thị alert màu xanh trên trang chi tiết hợp đồng
- ✅ Disable nút "Yêu cầu chấm dứt HĐ"
- ❌ Hợp đồng VẪN Ở trạng thái ACTIVE (chưa thay đổi)

---

### 2. **Chờ Phê Duyệt** (Pending Approval)

**Trạng thái:** `PENDING_APPROVAL`

**Hiển thị:**
- Trang `/dashboard/contracts/terminations` → Tab "Chờ phê duyệt"
- Trang chi tiết hợp đồng → Alert thông báo đang chờ duyệt
- Dashboard → Widget "Termination Alerts"

**Thông tin hiển thị:**
- Thông tin nhân viên (Tên, Mã NV, Chức vụ, Phòng ban)
- Loại chấm dứt
- Ngày chấm dứt dự kiến
- Số ngày còn lại (với cảnh báo màu nếu ≤7 ngày)
- Lý do chi tiết
- Người yêu cầu

**Phân loại:**
- **Tất cả:** Hiển thị tất cả yêu cầu pending
- **Khẩn cấp:** Chỉ hiển thị yêu cầu có ngày chấm dứt ≤7 ngày

---

### 3. **Phê Duyệt** (Approve)

**Người thực hiện:** HR Manager hoặc Admin

**Vị trí:** Trang `/dashboard/contracts/terminations` → Nút "Phê duyệt"

**Thông tin cần nhập:**
- Ghi chú (tùy chọn)

**Khi phê duyệt, hệ thống tự động update:**

#### ✅ TerminationRequest Table
```typescript
{
  status: 'APPROVED',
  approverId: dto.approverId,
  approvedAt: new Date(),
  approverComments: dto.comments
}
```

#### ✅ Contract Table
```typescript
{
  status: 'TERMINATED',
  endDate: request.terminationDate,
  terminatedReason: request.reason
}
```

#### ✅ Employee Table
```typescript
{
  status: 'INACTIVE',
  endDate: request.terminationDate
}
```

**Các phần liên quan được update:**

1. **Contract Status** → `TERMINATED`
2. **Contract End Date** → Ngày chấm dứt từ yêu cầu
3. **Contract Terminated Reason** → Lý do từ yêu cầu
4. **Termination Request Status** → `APPROVED`
5. **Approver Info** → Lưu thông tin người phê duyệt
6. **Approved At** → Timestamp phê duyệt
7. **Employee Status** → `INACTIVE` ⭐ NEW
8. **Employee End Date** → Ngày chấm dứt từ yêu cầu ⭐ NEW

**Hiển thị sau khi phê duyệt:**
- ✅ Hợp đồng hiển thị badge "Đã chấm dứt"
- ✅ Không thể tạo yêu cầu chấm dứt mới
- ✅ Lịch sử hiển thị "Đã chấm dứt" với lý do
- ✅ Yêu cầu biến mất khỏi tab "Chờ phê duyệt"
- ✅ Stats counter giảm đi 1
- ✅ **Nhân viên hiển thị status "INACTIVE" trong danh sách** ⭐ NEW
- ✅ **Nhân viên không còn trong danh sách "Active Employees"** ⭐ NEW
- ✅ **Dashboard stats "Total Employees" giảm đi 1** ⭐ NEW

---

### 4. **Từ Chối** (Reject)

**Người thực hiện:** HR Manager hoặc Admin

**Vị trí:** Trang `/dashboard/contracts/terminations` → Nút "Từ chối"

**Thông tin cần nhập:**
- Lý do từ chối (bắt buộc)

**Khi từ chối, hệ thống tự động update:**

#### ✅ TerminationRequest Table
```typescript
{
  status: 'REJECTED',
  approverId: dto.approverId,
  approvedAt: new Date(),
  rejectionReason: dto.reason
}
```

#### ❌ Contract Table
**KHÔNG CÓ THAY ĐỔI** - Hợp đồng vẫn ở trạng thái ACTIVE

**Hiển thị sau khi từ chối:**
- ✅ Alert pending biến mất khỏi trang chi tiết hợp đồng
- ✅ Có thể tạo yêu cầu chấm dứt mới
- ✅ Yêu cầu biến mất khỏi tab "Chờ phê duyệt"
- ✅ Stats counter giảm đi 1
- ✅ Lịch sử hiển thị yêu cầu bị từ chối

---

## 📊 Database Schema

### TerminationRequest Table
```prisma
model TerminationRequest {
  id                   String              @id @default(uuid())
  contractId           String
  requestedBy          String
  terminationCategory  TerminationCategory
  noticeDate           DateTime
  terminationDate      DateTime
  reason               String
  status               TerminationStatus   @default(PENDING_APPROVAL)
  approverId           String?
  approvedAt           DateTime?
  approverComments     String?
  rejectionReason      String?
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  
  contract             Contract            @relation(...)
  requester            User                @relation(...)
  approver             User?               @relation(...)
}
```

### Contract Table (Relevant Fields)
```prisma
model Contract {
  id                String         @id @default(uuid())
  status            ContractStatus @default(ACTIVE)
  endDate           DateTime?
  terminatedReason  String?
  // ... other fields
}
```

### Employee Table (Relevant Fields) ⭐ NEW
```prisma
model Employee {
  id        String    @id @default(uuid())
  status    String    @default("ACTIVE") // ACTIVE, INACTIVE
  endDate   DateTime? // Ngày nghỉ việc
  // ... other fields
}
```

---

## 🎯 Use Cases

### Use Case 1: Nhân viên xin nghỉ việc
1. Nhân viên/HR tạo yêu cầu với category = `RESIGNATION`
2. Nhập ngày thông báo và ngày nghỉ việc (tuân thủ thời gian báo trước)
3. HR Manager xem xét và phê duyệt
4. Hợp đồng tự động chuyển sang TERMINATED

### Use Case 2: Công ty chấm dứt hợp đồng
1. HR tạo yêu cầu với category = `TERMINATION`
2. Nhập lý do chi tiết (vi phạm kỷ luật, tái cơ cấu, etc.)
3. HR Manager phê duyệt
4. Hợp đồng chấm dứt

### Use Case 3: Hợp đồng hết hạn
1. HR tạo yêu cầu với category = `CONTRACT_END`
2. Ngày chấm dứt = ngày hết hạn hợp đồng
3. HR Manager phê duyệt
4. Hợp đồng chấm dứt

### Use Case 4: Yêu cầu bị từ chối
1. Nhân viên tạo yêu cầu nghỉ việc
2. HR Manager xem xét và thấy không phù hợp
3. Từ chối với lý do cụ thể
4. Hợp đồng vẫn ACTIVE, nhân viên có thể tạo yêu cầu mới

---

## 🔐 Permissions

### Tạo Yêu Cầu
- ✅ Tất cả user có thể tạo yêu cầu cho hợp đồng của mình
- ✅ HR có thể tạo yêu cầu cho bất kỳ hợp đồng nào

### Phê Duyệt/Từ Chối
- ✅ HR_MANAGER
- ✅ ADMIN
- ❌ EMPLOYEE (không có quyền)

---

## 📧 Notifications (TODO)

Các email sẽ được gửi tự động:

1. **Khi tạo yêu cầu:**
   - Gửi đến: HR Manager, Admin
   - Nội dung: Thông báo có yêu cầu mới cần phê duyệt

2. **Khi phê duyệt:**
   - Gửi đến: Người yêu cầu, Nhân viên
   - Nội dung: Yêu cầu đã được phê duyệt

3. **Khi từ chối:**
   - Gửi đến: Người yêu cầu
   - Nội dung: Yêu cầu bị từ chối với lý do

---

## 🎨 UI/UX Features

### Trang Chi Tiết Hợp Đồng
- ✅ Alert cảnh báo hợp đồng sắp hết hạn (≤30 ngày)
- ✅ Alert hiển thị yêu cầu pending với thông tin chi tiết
- ✅ Disable nút khi có yêu cầu pending
- ✅ Tooltip giải thích workflow
- ✅ Sidebar hiển thị trạng thái và hướng dẫn

### Trang Quản Lý Chấm Dứt
- ✅ Stats cards: Pending, Urgent, Approved
- ✅ Filter: Tất cả / Khẩn cấp
- ✅ Tabs: Chờ phê duyệt / Lịch sử
- ✅ Color coding: Đỏ (urgent), Vàng (pending), Xanh (approved)
- ✅ Modal phê duyệt/từ chối với form validation

### Dashboard
- ✅ Widget "Termination Alerts" hiển thị yêu cầu urgent
- ✅ Link nhanh đến trang quản lý

---

## 🧪 Testing Checklist

Xem file `TERMINATION-WORKFLOW-TESTING.md` để biết chi tiết cách test.

---

## 📝 Notes

- Workflow tuân thủ Luật Lao động Việt Nam 2019
- Tất cả thay đổi được log trong database
- Email notifications sẽ được implement trong version tiếp theo
- Có thể mở rộng thêm approval levels (multi-level approval)
