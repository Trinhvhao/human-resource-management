# Requirements Document - Hệ Thống Quản Lý Nhân Sự

## Introduction

Hệ thống quản lý nhân sự (HRM System) là một ứng dụng web toàn diện giúp doanh nghiệp tự động hóa các quy trình quản lý nhân sự, từ quản lý hồ sơ nhân viên, chấm công, tính lương, đến báo cáo thống kê và phân quyền người dùng. Hệ thống được xây dựng với kiến trúc hiện đại sử dụng Next.js cho frontend, NestJS cho backend, Supabase làm cơ sở dữ liệu, và tích hợp chatbot AI nội bộ để hỗ trợ người dùng.

## Glossary

- **HRM_System**: Hệ thống quản lý nhân sự
- **Employee**: Nhân viên trong công ty
- **Department**: Phòng ban
- **Admin**: Quản trị viên hệ thống
- **HR_Manager**: Quản lý nhân sự
- **Manager**: Quản lý phòng ban
- **Attendance_System**: Hệ thống chấm công
- **Payroll_System**: Hệ thống tính lương
- **Contract**: Hợp đồng lao động
- **Reward**: Khen thưởng
- **Discipline**: Kỷ luật
- **AI_Chatbot**: Chatbot AI nội bộ
- **Authentication_System**: Hệ thống xác thực
- **Authorization_System**: Hệ thống phân quyền
- **Report_System**: Hệ thống báo cáo
- **Database**: Cơ sở dữ liệu Supabase

## Requirements

### Requirement 1: Quản lý hồ sơ nhân viên

**User Story:** Là HR_Manager, tôi muốn quản lý đầy đủ thông tin hồ sơ nhân viên, để có thể theo dõi và cập nhật thông tin nhân sự một cách hiệu quả.

#### Acceptance Criteria

1. THE HRM_System SHALL lưu trữ thông tin cơ bản của Employee bao gồm: họ tên, ngày sinh, giới tính, CMND/CCCD, địa chỉ, số điện thoại, email
2. THE HRM_System SHALL lưu trữ thông tin công việc của Employee bao gồm: mã nhân viên, chức vụ, phòng ban, ngày vào làm, trạng thái làm việc
3. WHEN HR_Manager tạo hồ sơ Employee mới, THE HRM_System SHALL tự động sinh mã nhân viên duy nhất
4. WHEN HR_Manager cập nhật thông tin Employee, THE HRM_System SHALL lưu lại lịch sử thay đổi với timestamp và người thực hiện
5. WHEN HR_Manager tìm kiếm Employee, THE HRM_System SHALL hỗ trợ tìm kiếm theo tên, mã nhân viên, phòng ban, chức vụ
6. THE HRM_System SHALL cho phép upload và lưu trữ các file đính kèm như ảnh đại diện, CV, bằng cấp
7. WHEN Employee nghỉ việc, THE HRM_System SHALL cập nhật trạng thái và lưu trữ thông tin ngày nghỉ việc

### Requirement 2: Quản lý phòng ban và cơ cấu tổ chức

**User Story:** Là Admin, tôi muốn quản lý cơ cấu phòng ban của công ty, để có thể tổ chức nhân sự một cách khoa học và rõ ràng.

#### Acceptance Criteria

1. THE HRM_System SHALL cho phép tạo, sửa, xóa Department
2. THE HRM_System SHALL lưu trữ thông tin Department bao gồm: tên phòng ban, mã phòng ban, mô tả, trưởng phòng
3. WHEN Admin gán Employee vào Department, THE HRM_System SHALL cập nhật thông tin phòng ban của Employee
4. THE HRM_System SHALL hiển thị sơ đồ cơ cấu tổ chức dạng cây (tree structure)
5. WHEN Admin xóa Department, IF Department có Employee, THEN THE HRM_System SHALL yêu cầu chuyển Employee sang Department khác trước khi xóa
6. THE HRM_System SHALL cho phép gán Manager cho mỗi Department

### Requirement 3: Hệ thống chấm công

**User Story:** Là Employee, tôi muốn chấm công hàng ngày, để hệ thống ghi nhận thời gian làm việc của tôi một cách chính xác.

#### Acceptance Criteria

1. WHEN Employee check-in, THE Attendance_System SHALL ghi nhận thời gian vào làm với timestamp chính xác
2. WHEN Employee check-out, THE Attendance_System SHALL ghi nhận thời gian ra về với timestamp chính xác
3. THE Attendance_System SHALL tính toán tổng số giờ làm việc trong ngày dựa trên thời gian check-in và check-out
4. IF Employee check-in sau giờ quy định, THEN THE Attendance_System SHALL đánh dấu là đi muộn
5. IF Employee check-out trước giờ quy định, THEN THE Attendance_System SHALL đánh dấu là về sớm
6. THE Attendance_System SHALL cho phép Employee xin nghỉ phép với lý do và thời gian
7. WHEN Employee gửi đơn xin nghỉ, THE Attendance_System SHALL gửi thông báo đến Manager để phê duyệt
8. WHEN Manager phê duyệt đơn nghỉ, THE Attendance_System SHALL cập nhật trạng thái và ghi nhận vào bảng chấm công
9. THE Attendance_System SHALL tạo báo cáo chấm công theo tháng cho mỗi Employee

### Requirement 4: Hệ thống tính lương

**User Story:** Là HR_Manager, tôi muốn hệ thống tự động tính lương cho nhân viên, để giảm thiểu sai sót và tiết kiệm thời gian.

#### Acceptance Criteria

1. THE Payroll_System SHALL lưu trữ thông tin lương cơ bản của Employee bao gồm: lương cơ bản, phụ cấp, hệ số lương
2. WHEN tính lương tháng, THE Payroll_System SHALL tính toán dựa trên: lương cơ bản, số ngày công thực tế, phụ cấp, thưởng, kỷ luật
3. THE Payroll_System SHALL tự động trừ các khoản: bảo hiểm xã hội, bảo hiểm y tế, thuế thu nhập cá nhân
4. THE Payroll_System SHALL tính lương làm thêm giờ với hệ số quy định (150%, 200%, 300%)
5. WHEN HR_Manager tạo bảng lương tháng, THE Payroll_System SHALL tự động tính toán cho tất cả Employee đang làm việc
6. THE Payroll_System SHALL cho phép HR_Manager điều chỉnh thủ công các khoản lương trước khi chốt
7. WHEN bảng lương được chốt, THE Payroll_System SHALL gửi thông báo đến Employee và không cho phép chỉnh sửa
8. THE Payroll_System SHALL tạo phiếu lương chi tiết cho mỗi Employee

### Requirement 5: Quản lý hợp đồng lao động

**User Story:** Là HR_Manager, tôi muốn quản lý hợp đồng lao động của nhân viên, để theo dõi thời hạn và gia hạn hợp đồng kịp thời.

#### Acceptance Criteria

1. THE HRM_System SHALL lưu trữ thông tin Contract bao gồm: loại hợp đồng, ngày bắt đầu, ngày kết thúc, lương, điều khoản
2. THE HRM_System SHALL hỗ trợ các loại hợp đồng: thử việc, có thời hạn, không thời hạn
3. WHEN Contract sắp hết hạn (trước 30 ngày), THE HRM_System SHALL gửi thông báo nhắc nhở đến HR_Manager
4. THE HRM_System SHALL cho phép gia hạn hoặc tạo Contract mới cho Employee
5. THE HRM_System SHALL lưu trữ lịch sử các Contract của Employee
6. THE HRM_System SHALL cho phép upload file hợp đồng đã ký

### Requirement 6: Quản lý khen thưởng và kỷ luật

**User Story:** Là Manager, tôi muốn ghi nhận khen thưởng và kỷ luật cho nhân viên, để đánh giá hiệu suất làm việc một cách công bằng.

#### Acceptance Criteria

1. THE HRM_System SHALL cho phép Manager tạo Reward cho Employee với thông tin: lý do, số tiền/hình thức, ngày khen thưởng
2. THE HRM_System SHALL cho phép Manager tạo Discipline cho Employee với thông tin: lý do, hình thức, mức độ, ngày kỷ luật
3. WHEN Manager tạo Reward hoặc Discipline, THE HRM_System SHALL gửi thông báo đến Employee
4. THE HRM_System SHALL lưu trữ lịch sử Reward và Discipline của Employee
5. THE HRM_System SHALL tích hợp Reward và Discipline vào tính lương tháng

### Requirement 7: Hệ thống phân quyền

**User Story:** Là Admin, tôi muốn phân quyền truy cập cho người dùng, để đảm bảo an toàn dữ liệu và phân chia trách nhiệm rõ ràng.

#### Acceptance Criteria

1. THE Authorization_System SHALL hỗ trợ các vai trò: Admin, HR_Manager, Manager, Employee
2. THE Authorization_System SHALL định nghĩa quyền truy cập cho từng vai trò theo nguyên tắc least privilege
3. WHEN Admin tạo tài khoản mới, THE Authorization_System SHALL yêu cầu gán vai trò cho tài khoản
4. THE Authorization_System SHALL cho phép Admin gán nhiều vai trò cho một tài khoản
5. WHEN người dùng truy cập chức năng, THE Authorization_System SHALL kiểm tra quyền trước khi cho phép thực hiện
6. IF người dùng không có quyền, THEN THE Authorization_System SHALL hiển thị thông báo lỗi và từ chối truy cập
7. THE Authorization_System SHALL ghi log mọi hành động quan trọng với thông tin người thực hiện và thời gian

### Requirement 8: Hệ thống xác thực

**User Story:** Là người dùng, tôi muốn đăng nhập an toàn vào hệ thống, để bảo vệ thông tin cá nhân và dữ liệu công ty.

#### Acceptance Criteria

1. THE Authentication_System SHALL yêu cầu email và mật khẩu để đăng nhập
2. THE Authentication_System SHALL mã hóa mật khẩu trước khi lưu vào Database
3. WHEN người dùng đăng nhập thành công, THE Authentication_System SHALL tạo JWT token với thời gian hết hạn
4. THE Authentication_System SHALL hỗ trợ refresh token để gia hạn phiên làm việc
5. WHEN người dùng nhập sai mật khẩu 5 lần liên tiếp, THE Authentication_System SHALL khóa tài khoản trong 15 phút
6. THE Authentication_System SHALL cho phép người dùng đổi mật khẩu
7. THE Authentication_System SHALL gửi email xác nhận khi tạo tài khoản mới hoặc đặt lại mật khẩu
8. THE Authentication_System SHALL hỗ trợ đăng xuất và vô hiệu hóa token

### Requirement 9: Hệ thống báo cáo và thống kê

**User Story:** Là HR_Manager, tôi muốn xem các báo cáo thống kê trực quan, để nắm bắt tình hình nhân sự và đưa ra quyết định kịp thời.

#### Acceptance Criteria

1. THE Report_System SHALL tạo báo cáo tổng quan nhân sự bao gồm: tổng số nhân viên, phân bố theo phòng ban, độ tuổi, giới tính
2. THE Report_System SHALL tạo báo cáo chấm công theo tháng với thống kê: số ngày công, số ngày nghỉ, đi muộn, về sớm
3. THE Report_System SHALL tạo báo cáo lương theo tháng với tổng quỹ lương, phân bổ theo phòng ban
4. THE Report_System SHALL tạo báo cáo hợp đồng sắp hết hạn
5. THE Report_System SHALL hiển thị dữ liệu dưới dạng biểu đồ (cột, tròn, đường) và bảng
6. THE Report_System SHALL cho phép xuất báo cáo ra file Excel hoặc PDF
7. THE Report_System SHALL cho phép lọc dữ liệu theo khoảng thời gian, phòng ban, chức vụ
8. THE Report_System SHALL cập nhật dữ liệu real-time hoặc theo lịch định kỳ

### Requirement 10: Chatbot AI nội bộ

**User Story:** Là người dùng, tôi muốn hỏi chatbot AI về thông tin nhân sự và chính sách công ty, để nhận được câu trả lời nhanh chóng mà không cần tìm kiếm thủ công.

#### Acceptance Criteria

1. THE AI_Chatbot SHALL tích hợp vào giao diện HRM_System dưới dạng widget chat
2. WHEN người dùng gửi câu hỏi, THE AI_Chatbot SHALL phân tích ngữ nghĩa và trả lời bằng tiếng Việt
3. THE AI_Chatbot SHALL trả lời các câu hỏi về: chính sách nghỉ phép, quy trình chấm công, cách tính lương, thông tin phòng ban
4. WHEN AI_Chatbot không hiểu câu hỏi, THE AI_Chatbot SHALL đề xuất các câu hỏi gợi ý hoặc chuyển đến HR_Manager
5. THE AI_Chatbot SHALL truy vấn Database để cung cấp thông tin cá nhân của Employee (số ngày phép còn lại, lương tháng trước)
6. THE AI_Chatbot SHALL ghi nhận lịch sử hội thoại để cải thiện độ chính xác
7. THE AI_Chatbot SHALL chỉ trả lời thông tin mà người dùng có quyền truy cập theo Authorization_System
8. THE AI_Chatbot SHALL hỗ trợ các lệnh nhanh như: "Xem bảng lương tháng này", "Đăng ký nghỉ phép ngày mai"

### Requirement 11: Giao diện người dùng

**User Story:** Là người dùng, tôi muốn giao diện hệ thống đẹp, dễ sử dụng và responsive, để có trải nghiệm tốt trên mọi thiết bị.

#### Acceptance Criteria

1. THE HRM_System SHALL có giao diện responsive hoạt động tốt trên desktop, tablet và mobile
2. THE HRM_System SHALL sử dụng thiết kế hiện đại, tối giản với màu sắc chuyên nghiệp
3. THE HRM_System SHALL có navigation menu rõ ràng với các module chính
4. THE HRM_System SHALL hiển thị thông báo (notification) cho các sự kiện quan trọng
5. THE HRM_System SHALL có dashboard tổng quan khi người dùng đăng nhập
6. THE HRM_System SHALL hỗ trợ dark mode và light mode
7. WHEN người dùng thực hiện thao tác, THE HRM_System SHALL hiển thị loading indicator và feedback rõ ràng
8. THE HRM_System SHALL hỗ trợ đa ngôn ngữ (Tiếng Việt và Tiếng Anh)

### Requirement 12: Hiệu năng và bảo mật

**User Story:** Là Admin, tôi muốn hệ thống hoạt động nhanh, ổn định và an toàn, để đảm bảo trải nghiệm người dùng và bảo vệ dữ liệu công ty.

#### Acceptance Criteria

1. THE HRM_System SHALL tải trang chính trong vòng 2 giây với kết nối internet ổn định
2. THE HRM_System SHALL xử lý các thao tác CRUD trong vòng 1 giây
3. THE HRM_System SHALL hỗ trợ tối thiểu 100 người dùng đồng thời mà không giảm hiệu năng
4. THE HRM_System SHALL mã hóa dữ liệu nhạy cảm (mật khẩu, lương) trước khi lưu vào Database
5. THE HRM_System SHALL sử dụng HTTPS cho mọi kết nối
6. THE HRM_System SHALL thực hiện backup Database tự động hàng ngày
7. THE HRM_System SHALL có cơ chế xử lý lỗi và hiển thị thông báo thân thiện với người dùng
8. THE HRM_System SHALL ghi log các lỗi hệ thống để admin theo dõi và khắc phục

### Requirement 13: Tích hợp và mở rộng

**User Story:** Là Admin, tôi muốn hệ thống có khả năng tích hợp với các dịch vụ bên ngoài, để mở rộng chức năng trong tương lai.

#### Acceptance Criteria

1. THE HRM_System SHALL cung cấp REST API cho các hệ thống bên ngoài tích hợp
2. THE HRM_System SHALL có API documentation đầy đủ (Swagger/OpenAPI)
3. THE HRM_System SHALL hỗ trợ webhook để gửi thông báo đến các hệ thống khác
4. THE HRM_System SHALL cho phép tích hợp với email service (Gmail, Outlook) để gửi thông báo
5. THE HRM_System SHALL có kiến trúc module hóa để dễ dàng thêm chức năng mới
6. THE HRM_System SHALL sử dụng environment variables để cấu hình các tham số hệ thống
