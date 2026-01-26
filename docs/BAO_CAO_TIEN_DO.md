# BÁO CÁO TIẾN ĐỘ KHÓA LUẬN TỐT NGHIỆP
## Đề tài: Hệ thống Quản lý Nhân sự của Công ty

**Sinh viên thực hiện:** Khuất Trọng Hiếu  
**Mã sinh viên:** 22111060592  
**Lớp:** DH12C2  
**Giảng viên hướng dẫn:** Phạm Hồng Hải  
**Ngày cập nhật:** 15/01/2026

---

## TỔNG QUAN TIẾN ĐỘ

### Giai đoạn hiện tại
**Tuần 6-9: Lập trình các chức năng chính của hệ thống** - Đang thực hiện

### Tỷ lệ hoàn thành
- **Tổng thể:** ~75%
- **Phân tích & Thiết kế:** 100% (Hoàn thành)
- **Cơ sở dữ liệu:** 100% (Hoàn thành)
- **Backend API:** 85% (Đang thực hiện)
- **Frontend:** 0% (Chưa bắt đầu)

---

## TIẾN ĐỘ THEO KẾ HOẠCH

| Tuần | Công việc | Trạng thái | Kết quả |
|------|-----------|------------|---------|
| Tuần 1 | Khảo sát và thu thập yêu cầu | Hoàn thành | Tài liệu yêu cầu người dùng |
| Tuần 2-3 | Phân tích hệ thống, Use case, ERD | Hoàn thành | Sơ đồ UML, ERD đầy đủ |
| Tuần 4-5 | Thiết kế giao diện và CSDL | Hoàn thành | Mô hình CSDL 15 bảng |
| **Tuần 6-9** | **Lập trình chức năng chính** | **Đang thực hiện** | **11/12 module hoàn thành** |
| Tuần 10-11 | Hoàn thiện chức năng nâng cao | Sắp tới | - |
| Tuần 12 | Kiểm thử và sửa lỗi | Sắp tới | - |
| Tuần 13 | Viết báo cáo khóa luận | Sắp tới | - |
| Tuần 14 | Hoàn chỉnh và nộp | Sắp tới | - |

---

## CÔNG VIỆC ĐÃ HOÀN THÀNH

### 1. Phân tích và Thiết kế Hệ thống (100%)

#### 1.1 Phân tích nghiệp vụ
- Khảo sát quy trình quản lý nhân sự thực tế tại doanh nghiệp
- Xác định các đối tượng sử dụng: Quản trị viên, Quản lý nhân sự, Nhân viên
- Phân tích 10 nghiệp vụ chính: Quản lý nhân viên, chấm công, tính lương, nghỉ phép, hợp đồng, khen thưởng, kỷ luật
- Xác định yêu cầu chức năng và phi chức năng

#### 1.2 Thiết kế Use Case
- Xây dựng Use Case Diagram cho toàn hệ thống
- Mô tả chi tiết 25+ use case với luồng chính và luồng thay thế
- Xác định mối quan hệ giữa các use case (include, extend)

#### 1.3 Thiết kế Cơ sở dữ liệu
- Thiết kế ERD (Entity Relationship Diagram) với 15 bảng dữ liệu
- Xác định quan hệ 1-1, 1-n, n-n giữa các thực thể
- Thiết kế ràng buộc toàn vẹn dữ liệu (Primary Key, Foreign Key, Check, Unique)
- Tối ưu hóa index cho các trường thường xuyên truy vấn

**Các bảng chính:**
- **users:** Tài khoản người dùng với phân quyền
- **departments:** Phòng ban có cấu trúc phân cấp
- **employees:** Hồ sơ nhân viên đầy đủ
- **contracts:** Hợp đồng lao động
- **attendances:** Dữ liệu chấm công hàng ngày
- **leave_requests:** Đơn xin nghỉ phép
- **leave_balances:** Số ngày phép còn lại của nhân viên
- **holidays:** Danh sách ngày lễ, nghỉ
- **payrolls & payroll_items:** Bảng lương chi tiết
- **rewards & disciplines:** Khen thưởng và kỷ luật
- **employee_history:** Lịch sử thay đổi thông tin

### 2. Xây dựng Cơ sở Dữ liệu (100%)

#### 2.1 Triển khai Database
- Sử dụng PostgreSQL - hệ quản trị CSDL mã nguồn mở mạnh mẽ
- Triển khai trên Supabase Cloud để đảm bảo tính sẵn sàng cao
- Tạo 15 bảng với đầy đủ ràng buộc và quan hệ
- Thiết lập Foreign Key với cascade delete/update hợp lý

#### 2.2 Migration và Dữ liệu mẫu
- Viết script migration SQL để tạo cấu trúc database
- Tạo dữ liệu mẫu để kiểm thử:
  - 5 phòng ban (IT, Nhân sự, Kế toán, Marketing, Kinh doanh)
  - 10 nhân viên với đầy đủ thông tin
  - 12 tài khoản người dùng với các vai trò khác nhau
  - Dữ liệu chấm công, nghỉ phép, lương mẫu
- Kiểm tra tính toàn vẹn và nhất quán dữ liệu

#### 2.3 Tích hợp ORM
- Cấu hình Prisma ORM - công cụ truy vấn database hiện đại
- Tạo schema models tương ứng với database
- Kết nối và đồng bộ thành công với database

### 3. Lập trình Backend API (85%)

#### 3.1 Kiến trúc Hệ thống
- Sử dụng NestJS Framework - framework Node.js chuyên nghiệp
- Áp dụng kiến trúc Module-based để dễ bảo trì và mở rộng
- Tổ chức code theo mô hình MVC (Model-View-Controller)
- Tách biệt rõ ràng Controller - Service - Repository

#### 3.2 Xác thực và Phân quyền
- Triển khai JWT (JSON Web Token) Authentication
- Phân quyền theo vai trò: ADMIN, HR_MANAGER, EMPLOYEE
- Bảo mật endpoints với Guards và Decorators
- Mã hóa mật khẩu với bcrypt

#### 3.3 Các Module Đã Hoàn Thành (11/12 modules)

**Module 1: Xác thực (4 endpoints)**
- Đăng nhập với email và mật khẩu
- Đăng ký tài khoản mới
- Xem thông tin cá nhân
- Đổi mật khẩu

**Module 2: Quản lý Người dùng (7 endpoints)**
- Danh sách người dùng với phân trang, tìm kiếm, lọc
- Xem chi tiết thông tin người dùng
- Thêm, cập nhật, xóa người dùng
- Phân quyền vai trò cho người dùng

**Module 3: Quản lý Phòng ban (5 endpoints)**
- Danh sách phòng ban
- Hiển thị cây tổ chức phân cấp
- Thêm, sửa, xóa phòng ban
- Chỉ định trưởng phòng

**Module 4: Quản lý Nhân viên (6 endpoints)**
- Danh sách nhân viên với bộ lọc nâng cao (theo phòng ban, chức vụ, trạng thái)
- Xem hồ sơ chi tiết nhân viên
- Thêm, cập nhật, xóa nhân viên
- Tự động tạo mã nhân viên theo quy tắc
- Thống kê nhân viên theo nhiều tiêu chí
- Xem lịch sử thay đổi thông tin

**Module 5: Quản lý Hợp đồng (8 endpoints)**
- Danh sách hợp đồng lao động
- Cảnh báo hợp đồng sắp hết hạn (trong 30 ngày)
- Tạo, cập nhật thông tin hợp đồng
- Gia hạn hợp đồng tự động
- Chấm dứt hợp đồng với lý do

**Module 6: Chấm công (8 endpoints)**
- Check-in/Check-out hàng ngày
- Tự động phát hiện đi muộn (sau 8:30 AM)
- Tự động phát hiện về sớm (trước 5:30 PM)
- Tính toán giờ làm việc thực tế
- Xem lịch sử chấm công theo nhân viên, tháng
- Báo cáo chấm công tổng hợp theo phòng ban
- Thống kê tỷ lệ đi muộn, về sớm

**Module 7: Quản lý Nghỉ phép (8 endpoints)**
- Tạo đơn xin nghỉ phép (phép năm, phép ốm, phép cá nhân)
- Tự động tính số ngày nghỉ (loại trừ cuối tuần và ngày lễ)
- Kiểm tra số ngày phép còn lại trước khi tạo đơn
- Quy trình phê duyệt đơn (Chờ duyệt → Đã duyệt/Từ chối)
- Tự động trừ ngày phép khi đơn được duyệt
- Danh sách đơn chờ duyệt cho quản lý
- Hủy đơn (chỉ khi đang chờ duyệt)
- Xem lịch sử đơn nghỉ phép

**Module 8: Quản lý Ngày phép (4 endpoints)**
- Xem số dư ngày phép (phép năm, phép ốm)
- Khởi tạo ngày phép đầu năm (12 ngày phép năm, 30 ngày phép ốm)
- Điều chỉnh số ngày phép
- Tự động trừ/cộng khi duyệt/hủy đơn nghỉ

**Module 9: Quản lý Ngày lễ (6 endpoints)**
- Danh sách ngày lễ, nghỉ
- Thêm, xóa ngày lễ
- Khởi tạo tự động ngày lễ Việt Nam (Tết Dương lịch, 30/4, 1/5, 2/9)
- Tính số ngày làm việc trong tháng (trừ T7, CN, ngày lễ)
- Tích hợp vào tính công và tính lương

**Module 10: Tính lương (5 endpoints)**
- Tạo bảng lương theo tháng cho toàn bộ nhân viên
- Tự động tính lương theo công thức phức tạp:
  - Lương cơ bản × (Ngày công thực tế / Ngày công chuẩn)
  - Cộng phụ cấp, thưởng
  - Trừ kỷ luật
  - Tính lương tăng ca (150% lương giờ)
  - Trừ bảo hiểm (10.5%)
  - Tính thuế thu nhập cá nhân theo 7 bậc thuế
- Điều chỉnh thủ công các khoản phụ cấp, thưởng, phạt
- Chốt bảng lương (không cho sửa sau khi chốt)
- Xem phiếu lương cá nhân

**Module 11: Khen thưởng (4 endpoints)**
- Danh sách khen thưởng
- Thêm, xóa khen thưởng
- Tự động tích hợp vào bảng lương tháng

**Module 12: Kỷ luật (4 endpoints)**
- Danh sách kỷ luật
- Thêm, xóa kỷ luật
- Tự động tích hợp vào bảng lương tháng

#### 3.4 Tài liệu API
- Tích hợp Swagger/OpenAPI - chuẩn tài liệu API quốc tế
- Tài liệu tự động cho 58 endpoints
- Mô tả chi tiết request/response, ví dụ cụ thể
- Hỗ trợ test API trực tiếp trên trình duyệt
- Phân nhóm theo module, dễ tìm kiếm
- Truy cập tại: http://localhost:3002/api/docs

#### 3.5 Xử lý Lỗi và Validation
- Global Exception Filter - xử lý lỗi tập trung
- Validation tự động với class-validator
- Thông báo lỗi rõ ràng, dễ hiểu bằng tiếng Việt
- HTTP status code chuẩn (200, 201, 400, 401, 403, 404, 500)

#### 3.6 Kiểm thử
- Kiểm thử thủ công toàn bộ 58 endpoints
- Kiểm thử các luồng nghiệp vụ phức tạp:
  - Tạo đơn nghỉ phép → Kiểm tra số dư → Duyệt → Trừ ngày phép
  - Chấm công → Tính công → Tạo bảng lương → Tính thuế
  - Gia hạn hợp đồng → Cảnh báo hết hạn
- Kiểm thử phân quyền: Admin, HR Manager, Employee
- Kiểm thử xử lý lỗi và validation

---

## CÔNG VIỆC ĐANG THỰC HIỆN

### 1. Module Dashboard & Báo cáo (Tuần 9)
- Thiết kế API báo cáo tổng quan
- Thống kê tổng số nhân viên, phòng ban
- Biểu đồ tăng trưởng nhân sự
- Báo cáo chấm công tháng
- Báo cáo lương tháng
- Cảnh báo (hợp đồng hết hạn, đơn chờ duyệt)

### 2. Tối ưu hóa
- Cải thiện hiệu năng truy vấn database
- Tối ưu logic tính lương phức tạp
- Bổ sung thêm validation

---

## CÔNG VIỆC SẮP TỚI

### Tuần 10-11: Chức năng nâng cao và Frontend
**Backend:**
- [ ] Xuất báo cáo Excel (danh sách nhân viên, bảng lương, chấm công)
- [ ] Xuất phiếu lương PDF
- [ ] Upload avatar nhân viên
- [ ] Upload file hợp đồng PDF
- [ ] Gửi email thông báo khi duyệt đơn

**Frontend:**
- [ ] Thiết kế giao diện người dùng với Next.js
- [ ] Trang đăng nhập
- [ ] Dashboard tổng quan
- [ ] Quản lý nhân viên
- [ ] Chấm công
- [ ] Quản lý nghỉ phép
- [ ] Xem bảng lương

### Tuần 12: Kiểm thử toàn diện
- [ ] Kiểm thử chức năng từng module
- [ ] Kiểm thử tích hợp giữa các module
- [ ] Kiểm thử bảo mật và phân quyền
- [ ] Kiểm thử giao diện trên nhiều trình duyệt
- [ ] Kiểm thử hiệu năng với dữ liệu lớn
- [ ] Sửa lỗi phát hiện

### Tuần 13-14: Hoàn thiện và Báo cáo
- [ ] Hoàn thiện tài liệu hướng dẫn sử dụng
- [ ] Viết báo cáo khóa luận đầy đủ
- [ ] Chuẩn bị slide thuyết trình
- [ ] Chuẩn bị demo sản phẩm

---

## THỐNG KÊ HỆ THỐNG

### Backend API
- **Tổng số modules:** 12
- **Modules hoàn thành:** 11 (92%)
- **Tổng số endpoints:** 58
- **Endpoints hoạt động:** 58 (100%)
- **Bảng dữ liệu:** 15
- **Dòng code:** ~9,000 lines
- **Tài liệu API:** Đầy đủ với Swagger

### Công nghệ sử dụng
**Backend:**
- NestJS 11 (Node.js Framework)
- TypeScript 5
- Prisma ORM 5
- PostgreSQL 15 (Supabase)
- JWT Authentication
- Swagger/OpenAPI 3.0
- bcrypt (mã hóa mật khẩu)

**Frontend (Dự kiến):**
- Next.js 15
- React 19
- TypeScript 5
- Tailwind CSS 4
- Shadcn/ui (Component library)

**DevOps:**
- Git/GitHub (Version control)
- pnpm (Package manager)
- ESLint + Prettier (Code quality)

---

## ĐÁNH GIÁ TIẾN ĐỘ

### Điểm mạnh
- **Đúng tiến độ:** Hoàn thành đúng kế hoạch giai đoạn phân tích, thiết kế và lập trình backend
- **Thiết kế tốt:** Cơ sở dữ liệu được thiết kế chuẩn, đầy đủ ràng buộc
- **Code chất lượng:** Backend có cấu trúc rõ ràng, dễ bảo trì, tuân thủ best practices
- **Nghiệp vụ đầy đủ:** Đã triển khai 11/12 module với logic nghiệp vụ phức tạp
- **Tài liệu đầy đủ:** Có tài liệu API chi tiết, dễ sử dụng
- **Kiểm thử kỹ:** Tất cả endpoints đã được kiểm thử thủ công

### Thách thức
- **Thời gian:** Cần tập trung cao để hoàn thành frontend trong 2 tuần
- **Tính năng nâng cao:** Xuất Excel/PDF cần thêm thời gian
- **Giao diện:** Cần thiết kế UI/UX đẹp, dễ dùng

### Kế hoạch khắc phục
- Hoàn thành module Dashboard trong tuần 9
- Tập trung xây dựng Frontend từ tuần 10
- Ưu tiên các tính năng cốt lõi trước, tính năng nâng cao sau
- Dành tuần 12 để kiểm thử kỹ lưỡng
- Đảm bảo hoàn thành đúng hạn tuần 14

---

## KẾT LUẬN

Dự án đang đi **đúng tiến độ** theo kế hoạch đề ra trong đề cương. Giai đoạn phân tích, thiết kế và xây dựng backend đã hoàn thành **85%**, vượt mục tiêu đề ra.

Hệ thống đã có đầy đủ các **chức năng nghiệp vụ cốt lõi** của một hệ thống quản lý nhân sự chuyên nghiệp, bao gồm:
- Quản lý hồ sơ nhân viên đầy đủ
- Chấm công tự động với phát hiện đi muộn/về sớm
- Tính lương phức tạp (bảo hiểm, thuế, thưởng, phạt, tăng ca)
- Quản lý nghỉ phép với kiểm tra số dư
- Quản lý hợp đồng với cảnh báo hết hạn
- Khen thưởng và kỷ luật tích hợp vào lương

Các **logic nghiệp vụ phức tạp** đã được xử lý tốt:
- Tính ngày công theo ngày lễ Việt Nam
- Tính thuế thu nhập cá nhân theo 7 bậc
- Quy trình phê duyệt đơn nghỉ phép
- Tự động trừ ngày phép khi duyệt đơn
- Cảnh báo hợp đồng sắp hết hạn

Trong **2 tuần tới**, sẽ tập trung:
1. Hoàn thiện module Dashboard
2. Xây dựng giao diện Frontend
3. Kiểm thử toàn diện hệ thống
4. Hoàn thiện báo cáo khóa luận

Với tiến độ hiện tại, dự án **hoàn toàn có thể hoàn thành đúng hạn** và đạt được các mục tiêu đề ra trong đề cương.

---

**Người lập báo cáo:** Khuất Trọng Hiếu  
**Ngày:** 15/01/2026  
**Chữ ký:**
