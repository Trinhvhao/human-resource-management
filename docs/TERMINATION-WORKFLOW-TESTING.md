# Hướng Dẫn Test Workflow Chấm Dứt Hợp Đồng

## 🎯 Mục Đích

Tài liệu này hướng dẫn chi tiết cách test workflow chấm dứt hợp đồng từ đầu đến cuối, đảm bảo tất cả các tính năng hoạt động đúng.

---

## 🔧 Chuẩn Bị

### 1. Khởi động Backend & Frontend

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend  
cd apps/frontend
npm run dev
```

### 2. Đăng nhập với các role khác nhau

**Admin Account:**
- Email: `admin@company.com`
- Password: `Password123!`
- Role: ADMIN (có quyền phê duyệt)

**HR Manager Account:**
- Email: `hr@company.com`
- Password: `Password123!`
- Role: HR_MANAGER (có quyền phê duyệt)

**Employee Account:**
- Email: `employee@company.com`
- Password: `Password123!`
- Role: EMPLOYEE (không có quyền phê duyệt)

---

## 📝 Test Cases

### Test Case 1: Tạo Yêu Cầu Chấm Dứt Hợp Đồng

**Mục tiêu:** Kiểm tra việc tạo yêu cầu chấm dứt hợp đồng

**Bước thực hiện:**

1. **Đăng nhập** với bất kỳ account nào
2. **Navigate** đến `/dashboard/contracts`
3. **Click** vào một hợp đồng đang ACTIVE
4. **Kiểm tra** trang chi tiết hợp đồng:
   - ✅ Có nút "Yêu cầu chấm dứt HĐ" (màu đỏ)
   - ✅ Sidebar có section "Thao tác" với lưu ý về workflow
   - ✅ Không có alert pending

5. **Click** nút "Yêu cầu chấm dứt HĐ"
6. **Kiểm tra** modal hiển thị:
   - ✅ Title: "Yêu cầu chấm dứt hợp đồng"
   - ✅ Form có đầy đủ fields
   - ✅ Modal không bị che bởi sidebar (z-index: 9999)

7. **Điền form:**
   - Loại chấm dứt: Nghỉ việc
   - Ngày thông báo: Hôm nay
   - Ngày chấm dứt: 30 ngày sau (tuân thủ thời gian báo trước)
   - Lý do: "Tìm được công việc mới phù hợp hơn"

8. **Click** "Gửi yêu cầu"

**Kết quả mong đợi:**

- ✅ Toast success: "Yêu cầu chấm dứt hợp đồng đã được gửi"
- ✅ Modal đóng lại
- ✅ Trang reload và hiển thị:
  - Alert màu xanh: "Yêu cầu chấm dứt hợp đồng đang chờ phê duyệt"
  - Alert có thông tin: Loại, Ngày chấm dứt, Người yêu cầu
  - Alert có nút "Xem chi tiết →"
  - Header hiển thị badge "Đang chờ duyệt chấm dứt"
  - Sidebar hiển thị "Đang chờ phê duyệt" với icon Clock
  - Nút "Yêu cầu chấm dứt HĐ" KHÔNG còn hiển thị

**Test validation:**

9. **Thử tạo yêu cầu thứ 2** (không được phép):
   - Không có nút để tạo → ✅ Pass

10. **Kiểm tra database:**
```sql
SELECT * FROM "TerminationRequest" 
WHERE "contractId" = 'your-contract-id' 
ORDER BY "createdAt" DESC LIMIT 1;
```
- ✅ status = 'PENDING_APPROVAL'
- ✅ Có đầy đủ thông tin

---

### Test Case 2: Xem Danh Sách Yêu Cầu Chờ Phê Duyệt

**Mục tiêu:** Kiểm tra trang quản lý chấm dứt hợp đồng

**Bước thực hiện:**

1. **Đăng nhập** với Admin hoặc HR Manager
2. **Navigate** đến `/dashboard/contracts/terminations`
3. **Kiểm tra** trang hiển thị:
   - ✅ Header: "Quản lý chấm dứt hợp đồng"
   - ✅ 3 stats cards:
     - Chờ phê duyệt: 1 (hoặc số lượng thực tế)
     - Khẩn cấp: 0 (nếu ngày chấm dứt >7 ngày)
     - Đã phê duyệt tháng này: 0
   - ✅ Filter buttons: "Tất cả (1)" và "Khẩn cấp (0)"
   - ✅ Tab "Chờ phê duyệt" active với badge count

4. **Kiểm tra** card yêu cầu:
   - ✅ Hiển thị thông tin nhân viên (Avatar, Tên, Mã NV, Chức vụ, Phòng ban)
   - ✅ Hiển thị loại chấm dứt
   - ✅ Hiển thị ngày chấm dứt
   - ✅ Hiển thị số ngày còn lại (màu xanh nếu >7 ngày)
   - ✅ Hiển thị lý do
   - ✅ Hiển thị người yêu cầu
   - ✅ Có 2 nút: "Phê duyệt" (xanh) và "Từ chối" (đỏ)

5. **Test filter "Khẩn cấp":**
   - Click nút "Khẩn cấp"
   - ✅ Nếu không có yêu cầu urgent → Hiển thị "Không có yêu cầu khẩn cấp"
   - ✅ Nếu có → Chỉ hiển thị yêu cầu có ngày chấm dứt ≤7 ngày

**Test với Employee role:**

6. **Đăng nhập** với Employee account
7. **Navigate** đến `/dashboard/contracts/terminations`
8. **Kết quả mong đợi:**
   - ✅ Hiển thị message: "Không có quyền truy cập"
   - ✅ Icon AlertCircle màu đỏ
   - ✅ Text: "Chỉ HR Manager và Admin mới có thể phê duyệt..."

---

### Test Case 3: Phê Duyệt Yêu Cầu

**Mục tiêu:** Kiểm tra workflow phê duyệt

**Bước thực hiện:**

1. **Đăng nhập** với Admin hoặc HR Manager
2. **Navigate** đến `/dashboard/contracts/terminations`
3. **Click** nút "Phê duyệt" trên card yêu cầu
4. **Kiểm tra** modal:
   - ✅ Title: "Phê duyệt yêu cầu chấm dứt hợp đồng"
   - ✅ Hiển thị tên nhân viên
   - ✅ Có textarea "Ghi chú (tùy chọn)"
   - ✅ Modal không bị che bởi sidebar
   - ✅ 2 nút: "Hủy" và "Xác nhận phê duyệt"

5. **Nhập ghi chú** (tùy chọn): "Đã xác nhận với phòng ban"
6. **Click** "Xác nhận phê duyệt"

**Kết quả mong đợi:**

- ✅ Toast success: "Đã phê duyệt yêu cầu chấm dứt hợp đồng"
- ✅ Modal đóng
- ✅ Card yêu cầu biến mất khỏi danh sách
- ✅ Stats counter "Chờ phê duyệt" giảm đi 1
- ✅ Stats counter "Đã phê duyệt tháng này" tăng lên 1

7. **Navigate** đến trang chi tiết hợp đồng
8. **Kiểm tra:**
   - ✅ Badge status: "Đã chấm dứt" (màu xám)
   - ✅ Alert pending KHÔNG còn hiển thị
   - ✅ Không có nút "Yêu cầu chấm dứt HĐ"
   - ✅ Timeline hiển thị "Đã chấm dứt" với icon XCircle màu đỏ
   - ✅ Ngày kết thúc = ngày chấm dứt từ yêu cầu

9. **Kiểm tra database:**
```sql
-- TerminationRequest
SELECT * FROM "TerminationRequest" WHERE id = 'request-id';
-- ✅ status = 'APPROVED'
-- ✅ approverId có giá trị
-- ✅ approvedAt có timestamp
-- ✅ approverComments có ghi chú

-- Contract
SELECT * FROM "Contract" WHERE id = 'contract-id';
-- ✅ status = 'TERMINATED'
-- ✅ endDate = terminationDate từ request
-- ✅ terminatedReason = reason từ request
```

---

### Test Case 4: Từ Chối Yêu Cầu

**Mục tiêu:** Kiểm tra workflow từ chối

**Bước thực hiện:**

1. **Tạo yêu cầu mới** (theo Test Case 1)
2. **Đăng nhập** với Admin hoặc HR Manager
3. **Navigate** đến `/dashboard/contracts/terminations`
4. **Click** nút "Từ chối" trên card yêu cầu
5. **Kiểm tra** modal:
   - ✅ Title: "Từ chối yêu cầu chấm dứt hợp đồng"
   - ✅ Hiển thị tên nhân viên
   - ✅ Có textarea "Lý do từ chối *" (required)
   - ✅ 2 nút: "Hủy" và "Xác nhận từ chối"

6. **Thử submit** mà không nhập lý do:
   - ✅ Hiển thị validation error: "Vui lòng nhập lý do từ chối"

7. **Nhập lý do:** "Thời gian báo trước chưa đủ theo quy định"
8. **Click** "Xác nhận từ chối"

**Kết quả mong đợi:**

- ✅ Toast success: "Đã từ chối yêu cầu chấm dứt hợp đồng"
- ✅ Modal đóng
- ✅ Card yêu cầu biến mất khỏi danh sách
- ✅ Stats counter "Chờ phê duyệt" giảm đi 1

9. **Navigate** đến trang chi tiết hợp đồng
10. **Kiểm tra:**
    - ✅ Badge status: "Đang hiệu lực" (màu xanh)
    - ✅ Alert pending KHÔNG còn hiển thị
    - ✅ Có nút "Yêu cầu chấm dứt HĐ" (có thể tạo yêu cầu mới)
    - ✅ Hợp đồng vẫn ACTIVE

11. **Kiểm tra database:**
```sql
-- TerminationRequest
SELECT * FROM "TerminationRequest" WHERE id = 'request-id';
-- ✅ status = 'REJECTED'
-- ✅ approverId có giá trị
-- ✅ approvedAt có timestamp
-- ✅ rejectionReason có lý do

-- Contract
SELECT * FROM "Contract" WHERE id = 'contract-id';
-- ✅ status = 'ACTIVE' (KHÔNG THAY ĐỔI)
-- ✅ endDate = giá trị cũ (KHÔNG THAY ĐỔI)
```

---

### Test Case 5: Validation Thời Gian Báo Trước

**Mục tiêu:** Kiểm tra validation theo Luật Lao động

**Test 5.1: Hợp đồng thử việc (3 ngày)**

1. Tạo yêu cầu cho hợp đồng PROBATION
2. Ngày thông báo: Hôm nay
3. Ngày chấm dứt: 2 ngày sau
4. **Kết quả:** ❌ Error: "Thời gian báo trước phải ít nhất 3 ngày"

**Test 5.2: Hợp đồng có thời hạn (30 ngày)**

1. Tạo yêu cầu cho hợp đồng FIXED_TERM
2. Ngày thông báo: Hôm nay
3. Ngày chấm dứt: 20 ngày sau
4. **Kết quả:** ❌ Error: "Thời gian báo trước phải ít nhất 30 ngày"

**Test 5.3: Hợp đồng không thời hạn (45 ngày)**

1. Tạo yêu cầu cho hợp đồng INDEFINITE
2. Ngày thông báo: Hôm nay
3. Ngày chấm dứt: 40 ngày sau
4. **Kết quả:** ❌ Error: "Thời gian báo trước phải ít nhất 45 ngày"

---

### Test Case 6: Yêu Cầu Khẩn Cấp (Urgent)

**Mục tiêu:** Kiểm tra filter và hiển thị yêu cầu urgent

**Bước thực hiện:**

1. **Tạo yêu cầu** với ngày chấm dứt = 5 ngày sau
2. **Navigate** đến `/dashboard/contracts/terminations`
3. **Kiểm tra:**
   - ✅ Stats "Khẩn cấp": 1
   - ✅ Card hiển thị badge đỏ "Khẩn cấp"
   - ✅ Số ngày còn lại màu đỏ: "5 ngày"
   - ✅ Icon Flame màu đỏ

4. **Click** filter "Khẩn cấp"
5. **Kiểm tra:**
   - ✅ Chỉ hiển thị yêu cầu có ngày chấm dứt ≤7 ngày
   - ✅ Button "Khẩn cấp" active (màu đỏ)

---

### Test Case 7: Multiple Requests

**Mục tiêu:** Kiểm tra xử lý nhiều yêu cầu

**Bước thực hiện:**

1. **Tạo 5 yêu cầu** cho 5 hợp đồng khác nhau
2. **Navigate** đến `/dashboard/contracts/terminations`
3. **Kiểm tra:**
   - ✅ Stats "Chờ phê duyệt": 5
   - ✅ Hiển thị 5 cards
   - ✅ Sắp xếp theo thời gian tạo (cũ nhất trước)

4. **Phê duyệt 2 yêu cầu**
5. **Kiểm tra:**
   - ✅ Stats "Chờ phê duyệt": 3
   - ✅ Stats "Đã phê duyệt tháng này": 2
   - ✅ Còn 3 cards

6. **Từ chối 1 yêu cầu**
7. **Kiểm tra:**
   - ✅ Stats "Chờ phê duyệt": 2
   - ✅ Còn 2 cards

---

## 🐛 Common Issues & Solutions

### Issue 1: Modal bị che bởi sidebar
**Triệu chứng:** Modal hiển thị nhưng phần backdrop che toàn bộ màn hình đen

**Giải pháp:**
- Kiểm tra modal có `style={{ zIndex: 9999 }}`
- Kiểm tra modal có `bg-black/60 backdrop-blur-sm`
- Đảm bảo modal render ngoài DashboardLayout

### Issue 2: Stats không update sau phê duyệt
**Triệu chứng:** Số liệu không thay đổi sau approve/reject

**Giải pháp:**
- Kiểm tra `onUpdate={fetchStats}` được gọi
- Kiểm tra `fetchStats()` trong TerminationApprovalPanel
- Check console log xem có error không

### Issue 3: Alert không hiển thị trên trang chi tiết
**Triệu chứng:** Không thấy alert pending sau khi tạo yêu cầu

**Giải pháp:**
- Kiểm tra `checkPendingTermination()` được gọi trong useEffect
- Kiểm tra API `/contracts/:id/termination-requests` hoạt động
- Check `pendingTermination` state có giá trị không

### Issue 4: Validation không hoạt động
**Triệu chứng:** Có thể tạo yêu cầu với thời gian báo trước không hợp lệ

**Giải pháp:**
- Kiểm tra backend `ContractValidationService`
- Check `validateTerminationNotice()` method
- Xem log backend có error không

---

## ✅ Checklist Tổng Hợp

### Frontend
- [ ] Modal hiển thị đúng (không bị che)
- [ ] Alert pending hiển thị đầy đủ thông tin
- [ ] Stats counter update real-time
- [ ] Filter hoạt động đúng
- [ ] Validation form đầy đủ
- [ ] Toast notifications hiển thị
- [ ] Loading states hoạt động
- [ ] Responsive trên mobile

### Backend
- [ ] API create termination request hoạt động
- [ ] API approve hoạt động
- [ ] API reject hoạt động
- [ ] Validation thời gian báo trước đúng
- [ ] Database update đúng
- [ ] Error handling đầy đủ

### Business Logic
- [ ] Không thể tạo 2 yêu cầu pending cho 1 hợp đồng
- [ ] Chỉ HR Manager/Admin mới phê duyệt được
- [ ] Hợp đồng TERMINATED không thể tạo yêu cầu
- [ ] Thời gian báo trước tuân thủ luật
- [ ] Từ chối không ảnh hưởng hợp đồng

---

## 📞 Support

Nếu gặp vấn đề khi test, check:
1. Console log (F12)
2. Network tab (API responses)
3. Backend logs
4. Database records

Happy Testing! 🎉
