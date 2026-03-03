import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding knowledge base...');

    // Get admin user
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    });

    if (!admin) {
        console.error('❌ No admin user found. Please create an admin user first.');
        return;
    }

    const knowledgeData = [
        {
            title: 'Quy định về giờ làm việc',
            content: `Giờ làm việc chính thức của công ty:
- Sáng: 8:30 - 12:00
- Chiều: 13:00 - 17:30
- Thứ 2 đến Thứ 6 (trừ ngày lễ)

Quy định về chấm công:
- Đi muộn quá 15 phút tính là trễ
- Về sớm quá 15 phút tính là về sớm
- Quẹt thẻ vào/ra bắt buộc

Nghỉ trưa: 12:00 - 13:00`,
            category: 'Chính sách',
            tags: ['giờ làm việc', 'chấm công', 'quy định'],
        },
        {
            title: 'Chính sách nghỉ phép năm',
            content: `Quy định về phép năm:
- Nhân viên được nghỉ 12 ngày phép năm
- Tích lũy 1 ngày/tháng làm việc
- Phép năm không sử dụng hết có thể chuyển sang năm sau (tối đa 5 ngày)
- Đăng ký trước ít nhất 3 ngày làm việc

Phép bệnh:
- Tối đa 30 ngày/năm
- Cần có giấy xác nhận của bác sĩ nếu nghỉ từ 2 ngày trở lên`,
            category: 'Chính sách',
            tags: ['nghỉ phép', 'phép năm', 'phép bệnh'],
        },
        {
            title: 'Quy định về tăng ca',
            content: `Chính sách tăng ca:
- Tối đa 30 giờ/tháng, 200 giờ/năm
- Hệ số lương: 150% lương giờ thường
- Thời gian tăng ca: Ngoài giờ hành chính (sau 17:30 hoặc cuối tuần)
- Cần đăng ký và được phê duyệt trước

Quy trình:
1. Tạo đơn tăng ca trên hệ thống
2. Quản lý trực tiếp phê duyệt
3. Chấm công tăng ca
4. Tính vào lương tháng`,
            category: 'Chính sách',
            tags: ['tăng ca', 'overtime', 'lương'],
        },
        {
            title: 'Chính sách lương và thuế',
            content: `Ngày trả lương: Ngày 5 hàng tháng

Cấu trúc lương:
- Lương cơ bản
- Phụ cấp (ăn trưa, xăng xe, điện thoại)
- Thưởng (theo hiệu suất)
- Tăng ca (nếu có)

Khấu trừ:
- BHXH: 10.5% (cap 36 triệu)
- BHYT: 1.5%
- BHTN: 1%
- Thuế TNCN: Lũy tiến 5-35%
- Giảm trừ gia cảnh: 11 triệu/người + 4.4 triệu/người phụ thuộc`,
            category: 'Chính sách',
            tags: ['lương', 'thuế', 'bảo hiểm'],
        },
        {
            title: 'Hướng dẫn đăng ký nghỉ phép',
            content: `Các bước đăng ký nghỉ phép:

Bước 1: Đăng nhập hệ thống
- Vào trang web HRMS
- Đăng nhập bằng email và mật khẩu

Bước 2: Tạo đơn nghỉ phép
- Click menu "Nghỉ phép"
- Click nút "Tạo đơn mới"
- Chọn loại phép (Phép năm/Phép bệnh)
- Chọn ngày bắt đầu và kết thúc
- Nhập lý do nghỉ phép
- Click "Gửi đơn"

Bước 3: Chờ phê duyệt
- Quản lý sẽ nhận thông báo
- Kiểm tra trạng thái đơn trong "Lịch sử đơn"
- Nhận email thông báo khi được duyệt`,
            category: 'Hướng dẫn',
            tags: ['nghỉ phép', 'quy trình', 'hướng dẫn'],
        },
        {
            title: 'Hướng dẫn chấm công',
            content: `Quy trình chấm công hàng ngày:

Khi đến công ty:
- Quẹt thẻ tại máy chấm công ở cổng
- Hoặc check-in trên app mobile
- Thời gian: Trước 8:30

Khi về:
- Quẹt thẻ tại máy chấm công
- Hoặc check-out trên app
- Thời gian: Sau 17:30

Lưu ý:
- Quên chấm công: Tạo đơn điều chỉnh chấm công
- Đi công tác: Báo trước với quản lý
- Làm việc từ xa: Check-in qua app`,
            category: 'Hướng dẫn',
            tags: ['chấm công', 'attendance', 'quy trình'],
        },
        {
            title: 'Làm thế nào để đổi mật khẩu?',
            content: `Hướng dẫn đổi mật khẩu:

Cách 1: Trong hệ thống
1. Click vào avatar ở góc phải màn hình
2. Chọn "Đổi mật khẩu"
3. Nhập mật khẩu hiện tại
4. Nhập mật khẩu mới (tối thiểu 8 ký tự)
5. Xác nhận mật khẩu mới
6. Click "Lưu"

Cách 2: Quên mật khẩu
1. Ở trang đăng nhập, click "Quên mật khẩu?"
2. Nhập email đăng ký
3. Kiểm tra email để nhận link reset
4. Click link và tạo mật khẩu mới

Lưu ý bảo mật:
- Không chia sẻ mật khẩu
- Đổi mật khẩu định kỳ 3 tháng
- Sử dụng mật khẩu mạnh`,
            category: 'FAQ',
            tags: ['mật khẩu', 'bảo mật', 'tài khoản'],
        },
        {
            title: 'Thông tin liên hệ phòng Nhân sự',
            content: `Thông tin liên hệ HR Department:

Email: hr@company.com
Hotline: 1900-xxxx
Zalo: 0912-xxx-xxx

Địa chỉ: Tầng 5, Tòa nhà ABC, Quận 1, TP.HCM

Giờ làm việc:
- Thứ 2 - Thứ 6: 8:30 - 17:30
- Nghỉ trưa: 12:00 - 13:00

Liên hệ khi cần:
- Hợp đồng lao động
- Bảo hiểm xã hội
- Lương thưởng
- Nghỉ phép, tăng ca
- Các vấn đề khác về nhân sự`,
            category: 'Thông tin',
            tags: ['liên hệ', 'HR', 'nhân sự'],
        },
        {
            title: 'Quy trình onboarding nhân viên mới',
            content: `Quy trình đón nhân viên mới:

Ngày đầu tiên:
- Nhận tài khoản hệ thống
- Nhận thẻ nhân viên
- Tour văn phòng
- Giới thiệu team

Tuần đầu tiên:
- Training về quy định công ty
- Setup máy tính và công cụ làm việc
- Gặp gỡ các phòng ban
- Nhận nhiệm vụ đầu tiên

Tháng đầu tiên:
- Mentor hỗ trợ
- Review tiến độ hàng tuần
- Đánh giá thử việc
- Feedback và điều chỉnh`,
            category: 'Quy trình',
            tags: ['onboarding', 'nhân viên mới', 'training'],
        },
        {
            title: 'Chính sách làm việc từ xa (Remote)',
            content: `Quy định về làm việc từ xa:

Điều kiện:
- Đã qua thử việc
- Công việc phù hợp với remote
- Có thiết bị và internet ổn định

Quy trình đăng ký:
1. Tạo đơn xin làm remote
2. Nêu rõ lý do và thời gian
3. Quản lý phê duyệt
4. Check-in/out qua app

Yêu cầu:
- Online đúng giờ làm việc
- Tham gia đầy đủ các meeting
- Báo cáo tiến độ công việc
- Sẵn sàng liên lạc khi cần

Giới hạn: Tối đa 2 ngày/tuần`,
            category: 'Chính sách',
            tags: ['remote', 'làm việc từ xa', 'WFH'],
        },
    ];

    console.log(`📝 Creating ${knowledgeData.length} knowledge entries...`);

    for (const data of knowledgeData) {
        try {
            // Note: Embedding will be generated automatically by the service
            // For seeding, we'll use raw SQL to insert without embedding first
            await prisma.$executeRaw`
        INSERT INTO company_knowledge (
          id, title, content, category, tags, "isActive", "createdBy", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          ${data.title},
          ${data.content},
          ${data.category},
          ${data.tags}::text[],
          true,
          ${admin.id}::text,
          NOW(),
          NOW()
        )
      `;
            console.log(`✅ Created: ${data.title}`);
        } catch (error) {
            console.error(`❌ Failed to create: ${data.title}`, error.message);
        }
    }

    console.log('✅ Knowledge base seeding completed!');
    console.log('⚠️  Note: Embeddings need to be generated via API or update each entry');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
