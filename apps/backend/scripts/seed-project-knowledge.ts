import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const knowledgeData = [
    {
        title: 'Thông tin về Hệ thống Quản lý Nhân sự',
        content: `Hệ thống Quản lý Nhân sự (HRMS) là một ứng dụng web toàn diện được phát triển bởi Khuất Trọng Hiếu.

**Thông tin dự án:**
- Tên: Human Resource Management System (HRMS)
- Người thực hiện: Khuất Trọng Hiếu
- Năm thực hiện: 2026
- Công nghệ: NestJS (Backend), Next.js (Frontend), PostgreSQL, Supabase

**Mục đích:**
Hệ thống giúp quản lý toàn bộ quy trình nhân sự từ tuyển dụng, chấm công, tính lương đến quản lý hợp đồng và phát triển nhân viên.

**Tính năng chính:**
1. Quản lý nhân viên và hồ sơ
2. Chấm công tự động (bao gồm nhận diện khuôn mặt)
3. Quản lý phép năm và nghỉ phép
4. Tính lương và phúc lợi
5. Quản lý hợp đồng lao động
6. Quản lý tăng ca
7. Quản lý phòng ban và cơ cấu tổ chức
8. Báo cáo và phân tích
9. AI Chatbot hỗ trợ nhân viên
10. Nhận diện khuôn mặt cho chấm công`,
        category: 'project_info',
        tags: ['project', 'hrms', 'thông tin', 'Khuất Trọng Hiếu'],
    },
    {
        title: 'Công nghệ và Stack kỹ thuật của HRMS',
        content: `**Backend:**
- Framework: NestJS (Node.js)
- Database: PostgreSQL với Supabase
- ORM: Prisma
- Authentication: JWT
- AI/ML: 
  - @vladmandic/face-api (nhận diện khuôn mặt)
  - @xenova/transformers (embedding)
  - OpenRouter API (LLM cho chatbot)

**Frontend:**
- Framework: Next.js 16 (React)
- UI: Tailwind CSS, shadcn/ui
- State Management: React Query (TanStack Query)
- Charts: Recharts
- Forms: React Hook Form

**Database:**
- PostgreSQL 15+
- pgvector extension (vector similarity search)
- Supabase (hosting + storage)

**DevOps:**
- Git/GitHub
- Environment: Development, Production
- Storage: Supabase Storage (ảnh, tài liệu)

**Tính năng đặc biệt:**
- RAG (Retrieval-Augmented Generation) cho chatbot
- Vector similarity search với pgvector
- Real-time updates
- Face recognition attendance
- Responsive design`,
        category: 'technical',
        tags: ['technology', 'stack', 'nestjs', 'nextjs', 'postgresql'],
    },
    {
        title: 'Thông tin tác giả - Khuất Trọng Hiếu',
        content: `**Tác giả:** Khuất Trọng Hiếu

**Vai trò:** Full-stack Developer, System Architect

**Dự án:** Hệ thống Quản lý Nhân sự (HRMS)

**Năm thực hiện:** 2026

**Kỹ năng:**
- Backend Development (NestJS, Node.js)
- Frontend Development (Next.js, React)
- Database Design (PostgreSQL, Prisma)
- AI/ML Integration (Face Recognition, RAG, LLM)
- System Architecture
- DevOps

**Thành tựu trong dự án:**
- Xây dựng hệ thống HRMS hoàn chỉnh từ đầu
- Tích hợp AI chatbot với RAG
- Triển khai nhận diện khuôn mặt cho chấm công
- Tối ưu hiệu suất với React Query và database indexing
- Thiết kế UI/UX thân thiện người dùng`,
        category: 'project_info',
        tags: ['author', 'developer', 'Khuất Trọng Hiếu', 'contact'],
    },
    {
        title: 'Cách sử dụng AI Chatbot trong HRMS',
        content: `**AI Chatbot** là trợ lý ảo thông minh giúp nhân viên tra cứu thông tin nhanh chóng.

**Các câu hỏi chatbot có thể trả lời:**

**1. Về phép năm:**
- "Tôi còn bao nhiêu ngày phép?"
- "Số dư phép năm của tôi?"
- "Phép bệnh còn bao nhiêu?"

**2. Về chấm công:**
- "Chấm công tháng này của tôi thế nào?"
- "Tôi đi muộn bao nhiêu lần?"
- "Tổng giờ làm việc tháng này?"

**3. Về lương:**
- "Lương tháng này của tôi bao nhiêu?"
- "Thông tin lương chi tiết?"
- "Lương thực lãnh là bao nhiêu?"

**4. Về tăng ca:**
- "Tôi đã tăng ca bao nhiêu giờ?"
- "Còn được tăng ca bao nhiêu giờ?"

**5. Về chính sách:**
- "Quy định về giờ làm việc?"
- "Chính sách nghỉ phép?"
- "Chính sách tăng ca?"

**6. Về hệ thống:**
- "Hệ thống này do ai phát triển?"
- "Công nghệ nào được sử dụng?"
- "Tính năng của hệ thống?"

**Công nghệ:**
- RAG (Retrieval-Augmented Generation)
- Vector similarity search với pgvector
- OpenRouter LLM API
- Context-aware responses`,
        category: 'faq',
        tags: ['chatbot', 'ai', 'hướng dẫn', 'usage'],
    },
    {
        title: 'Chấm công bằng nhận diện khuôn mặt',
        content: `**Tính năng nhận diện khuôn mặt** cho phép nhân viên chấm công nhanh chóng và chính xác.

**Cách sử dụng:**

**1. Đăng ký khuôn mặt (lần đầu):**
- Vào trang Profile
- Chọn "Đăng ký khuôn mặt"
- Chụp 3-5 ảnh khuôn mặt từ các góc độ khác nhau
- Đảm bảo ánh sáng tốt, nhìn thẳng vào camera

**2. Chấm công:**
- Vào trang Chấm công
- Chọn "Chấm công bằng khuôn mặt"
- Nhìn thẳng vào camera
- Hệ thống tự động nhận diện và chấm công

**Công nghệ:**
- Face-api.js (@vladmandic/face-api)
- TensorFlow.js
- SSD MobileNetV1 (face detection)
- Face Recognition Net (128D descriptors)
- Euclidean distance matching

**Độ chính xác:**
- Threshold: 0.6 (có thể điều chỉnh)
- Hỗ trợ nhiều ảnh đăng ký (tối đa 5)
- Tự động chọn ảnh khớp nhất

**Lưu ý:**
- Cần ánh sáng đủ
- Không đeo khẩu trang khi chấm công
- Nhìn thẳng vào camera`,
        category: 'technical',
        tags: ['face recognition', 'attendance', 'ai', 'biometric'],
    },
    {
        title: 'Kiến trúc hệ thống HRMS',
        content: `**Kiến trúc tổng quan:**

**1. Frontend (Next.js):**
- Server-side rendering (SSR)
- Client-side routing
- API integration với axios
- State management với React Query
- Real-time updates

**2. Backend (NestJS):**
- RESTful API
- JWT Authentication & Authorization
- Role-based access control (RBAC)
- Modular architecture
- Dependency injection

**3. Database (PostgreSQL + Supabase):**
- Relational data model
- Vector extension (pgvector) cho AI
- Indexes tối ưu hiệu suất
- Migrations với Prisma
- Supabase Storage cho files

**4. AI/ML Components:**
- Face Recognition Service
- Embedding Service (RAG)
- LLM Service (Chatbot)
- Knowledge Base với vector search

**5. Security:**
- JWT tokens
- Password hashing (bcrypt)
- CORS configuration
- Input validation
- SQL injection prevention (Prisma)

**6. Performance:**
- Database indexing
- Query optimization
- React Query caching
- Lazy loading
- Code splitting`,
        category: 'technical',
        tags: ['architecture', 'system design', 'technical'],
    },
];

async function main() {
    console.log('🚀 Bắt đầu seed knowledge...\n');

    // Tìm admin user
    const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    });

    if (!admin) {
        throw new Error('❌ Không tìm thấy admin user. Vui lòng tạo admin trước.');
    }

    console.log(`✓ Tìm thấy admin: ${admin.email}\n`);

    let created = 0;
    let skipped = 0;

    for (const data of knowledgeData) {
        // Check if already exists
        const existing = await prisma.companyKnowledge.findFirst({
            where: { title: data.title },
        });

        if (existing) {
            console.log(`⊘ Bỏ qua (đã tồn tại): ${data.title}`);
            skipped++;
            continue;
        }

        try {
            await prisma.companyKnowledge.create({
                data: {
                    title: data.title,
                    content: data.content,
                    category: data.category,
                    tags: data.tags,
                    createdBy: admin.id,
                },
            });
            console.log(`✓ Đã tạo: ${data.title}`);
            created++;
        } catch (error) {
            console.error(`✗ Lỗi khi tạo "${data.title}":`, error.message);
        }
    }

    console.log(`\n📊 Kết quả:`);
    console.log(`   - Đã tạo: ${created}`);
    console.log(`   - Bỏ qua: ${skipped}`);
    console.log(`   - Tổng: ${knowledgeData.length}`);
    console.log('\n✅ Hoàn thành!');
    console.log('\n💡 Lưu ý: Embeddings sẽ được tạo tự động khi chatbot sử dụng.');
}

main()
    .catch((error) => {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
