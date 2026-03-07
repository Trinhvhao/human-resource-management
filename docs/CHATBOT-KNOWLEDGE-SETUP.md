# Hướng dẫn thêm Knowledge cho Chatbot

## Cách thêm kiến thức

### 1. Qua API (Recommended)

**Endpoint:** `POST /chatbot/knowledge`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Tiêu đề kiến thức",
  "content": "Nội dung chi tiết...",
  "category": "project_info|company_policy|technical|faq",
  "tags": ["tag1", "tag2"],
  "metadata": {}
}
```

### 2. Qua Database trực tiếp

```sql
INSERT INTO company_knowledge (title, content, category, tags, created_by)
VALUES (
  'Tiêu đề',
  'Nội dung',
  'project_info',
  ARRAY['tag1', 'tag2'],
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);
```

## Knowledge mẫu về Project

### 1. Thông tin Project

**Title:** Thông tin về Hệ thống Quản lý Nhân sự

**Content:**
```
Hệ thống Quản lý Nhân sự (HRMS) là một ứng dụng web toàn diện được phát triển bởi Khuất Trọng Hiếu.

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
10. Nhận diện khuôn mặt cho chấm công
```

**Category:** `project_info`
**Tags:** `["project", "hrms", "thông tin", "Khuất Trọng Hiếu"]`

---

### 2. Công nghệ sử dụng

**Title:** Công nghệ và Stack kỹ thuật của HRMS

**Content:**
```
**Backend:**
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
- Responsive design
```

**Category:** `technical`
**Tags:** `["technology", "stack", "nestjs", "nextjs", "postgresql"]`

---

### 3. Tác giả và liên hệ

**Title:** Thông tin tác giả - Khuất Trọng Hiếu

**Content:**
```
**Tác giả:** Khuất Trọng Hiếu

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
- Thiết kế UI/UX thân thiện người dùng
```

**Category:** `project_info`
**Tags:** `["author", "developer", "Khuất Trọng Hiếu", "contact"]`

---

### 4. Hướng dẫn sử dụng Chatbot

**Title:** Cách sử dụng AI Chatbot trong HRMS

**Content:**
```
**AI Chatbot** là trợ lý ảo thông minh giúp nhân viên tra cứu thông tin nhanh chóng.

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
- Context-aware responses
```

**Category:** `faq`
**Tags:** `["chatbot", "ai", "hướng dẫn", "usage"]`

---

### 5. Tính năng nhận diện khuôn mặt

**Title:** Chấm công bằng nhận diện khuôn mặt

**Content:**
```
**Tính năng nhận diện khuôn mặt** cho phép nhân viên chấm công nhanh chóng và chính xác.

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
- Nhìn thẳng vào camera
```

**Category:** `technical`
**Tags:** `["face recognition", "attendance", "ai", "biometric"]`

---

## Script tự động thêm Knowledge

Tạo file `scripts/seed-knowledge.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const knowledgeData = [
  {
    title: "Thông tin về Hệ thống Quản lý Nhân sự",
    content: "...", // Copy từ trên
    category: "project_info",
    tags: ["project", "hrms", "thông tin", "Khuất Trọng Hiếu"]
  },
  // ... thêm các knowledge khác
];

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    throw new Error('Không tìm thấy admin user');
  }

  for (const data of knowledgeData) {
    await prisma.companyKnowledge.create({
      data: {
        ...data,
        createdBy: admin.id,
      }
    });
    console.log(`✓ Created: ${data.title}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Chạy: `npx ts-node scripts/seed-knowledge.ts`

## Test Chatbot

Sau khi thêm knowledge, test với các câu hỏi:

```
- "Hệ thống này do ai phát triển?"
- "Khuất Trọng Hiếu là ai?"
- "Công nghệ nào được sử dụng trong project?"
- "Tính năng của hệ thống?"
- "Cách sử dụng nhận diện khuôn mặt?"
```

Chatbot sẽ sử dụng RAG để tìm kiếm knowledge phù hợp và trả lời.
