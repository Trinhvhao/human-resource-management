# 🤖 AI CHATBOT MODULE

Module AI Chatbot hỏi đáp nội bộ công ty - Trợ lý ảo thông minh cho nhân viên.

## 📋 Tính năng

### 1. Hỏi đáp thông minh
- ✅ Phân tích intent tự động từ câu hỏi
- ✅ Trả lời bằng tiếng Việt tự nhiên
- ✅ Context-aware (biết thông tin người hỏi)
- ✅ Lịch sử chat

### 2. Các chủ đề hỗ trợ

#### 📅 Phép năm & Nghỉ phép
- Kiểm tra số dư phép
- Xem lịch sử đơn nghỉ phép
- Trạng thái đơn (pending/approved/rejected)

#### ⏰ Chấm công
- Tổng kết chấm công theo tháng
- Số lần đi muộn/về sớm
- Tổng giờ làm việc

#### 💰 Lương
- Thông tin lương chi tiết
- Phụ cấp, thưởng, khấu trừ
- BHXH, thuế TNCN
- Lương thực lãnh

#### ⏱️ Tăng ca
- Số giờ tăng ca đã làm
- Giới hạn còn lại
- Trạng thái đơn tăng ca

#### 📋 Chính sách công ty
- Giờ làm việc
- Quy định nghỉ phép
- Chính sách tăng ca
- Chính sách lương

#### 👤 Thông tin nhân viên
- Thông tin cá nhân
- Phòng ban
- Chức vụ

## 🚀 API Endpoints

### 1. Chat với AI
```http
POST /chatbot/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Tôi còn bao nhiêu ngày phép?",
  "history": [] // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "📊 **Thông tin phép năm 2026:**\n\n• Tổng phép năm: 12 ngày\n• Đã sử dụng: 3 ngày\n• Còn lại: 9 ngày\n• Phép bệnh: 30 ngày (đã dùng: 1)",
    "intent": "LEAVE_BALANCE",
    "additionalData": null
  }
}
```

### 2. Lịch sử chat
```http
GET /chatbot/history?limit=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "userMessage": "Tôi còn bao nhiêu ngày phép?",
      "botResponse": "📊 **Thông tin phép năm 2026:**...",
      "createdAt": "2026-01-21T10:00:00Z"
    }
  ],
  "meta": {
    "total": 10
  }
}
```

### 3. Gợi ý câu hỏi
```http
GET /chatbot/suggestions
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "Phép năm",
      "questions": [
        "Tôi còn bao nhiêu ngày phép?",
        "Số dư phép năm của tôi?",
        "Phép bệnh còn bao nhiêu?"
      ]
    },
    ...
  ]
}
```

## 💬 Câu hỏi mẫu

### Phép năm:
- "Tôi còn bao nhiêu ngày phép?"
- "Số dư phép năm của tôi?"
- "Phép bệnh còn bao nhiêu?"

### Chấm công:
- "Chấm công tháng này của tôi thế nào?"
- "Tôi đi muộn bao nhiêu lần tháng này?"
- "Tổng giờ làm việc tháng 12?"

### Lương:
- "Lương tháng này của tôi bao nhiêu?"
- "Lương tháng 12 của tôi?"
- "Thông tin lương chi tiết?"

### Tăng ca:
- "Tôi đã tăng ca bao nhiêu giờ?"
- "Còn được tăng ca bao nhiêu giờ?"
- "Quy định về tăng ca?"

### Chính sách:
- "Quy định về giờ làm việc?"
- "Chính sách nghỉ phép?"
- "Chính sách tăng ca?"
- "Chính sách lương?"

### Đơn từ:
- "Trạng thái đơn nghỉ phép của tôi?"
- "Đơn tăng ca của tôi?"
- "Các đơn đang chờ duyệt?"

## 🎯 Intent Detection

Module tự động phát hiện intent từ câu hỏi:

| Intent | Keywords | Example |
|--------|----------|---------|
| LEAVE_BALANCE | phép, nghỉ phép, số ngày phép | "Tôi còn bao nhiêu phép?" |
| ATTENDANCE_SUMMARY | chấm công, đi làm, công | "Chấm công tháng này?" |
| SALARY_INFO | lương, salary, thu nhập | "Lương tháng 12?" |
| OVERTIME_INFO | tăng ca, overtime, làm thêm | "Tôi tăng ca bao nhiêu giờ?" |
| COMPANY_POLICY | quy định, chính sách, policy | "Quy định giờ làm việc?" |
| EMPLOYEE_INFO | nhân viên, thông tin | "Thông tin của tôi?" |
| LEAVE_REQUEST_STATUS | đơn nghỉ, đơn phép | "Trạng thái đơn phép?" |
| GREETING | xin chào, hello, hi | "Xin chào!" |
| HELP | help, trợ giúp, giúp | "Help" |

## 🔧 Cấu trúc Code

```
chatbot/
├── chatbot.module.ts       # Module definition
├── chatbot.controller.ts   # API endpoints
├── chatbot.service.ts      # Business logic
├── dto/
│   └── chat.dto.ts        # DTOs
└── README.md              # Documentation
```

## 📊 Database Schema

```prisma
model ChatHistory {
  id           String   @id @default(uuid())
  employeeId   String
  userMessage  String   @db.Text
  botResponse  String   @db.Text
  createdAt    DateTime @default(now())
  
  employee     Employee @relation(...)
  
  @@map("chat_history")
  @@index([employeeId])
  @@index([createdAt])
}
```

## 🚀 Usage trong Frontend

### React/Next.js Example:

```typescript
// Chat component
const [messages, setMessages] = useState([]);
const [input, setInput] = useState('');

const sendMessage = async () => {
  const response = await fetch('/api/chatbot/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input,
      history: messages,
    }),
  });
  
  const data = await response.json();
  setMessages([
    ...messages,
    { role: 'user', content: input },
    { role: 'assistant', content: data.data.message },
  ]);
};

// Get suggestions
const getSuggestions = async () => {
  const response = await fetch('/api/chatbot/suggestions', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  return data.data;
};
```

## 🎨 UI Suggestions

### Chat Interface:
- Bubble chat style (user bên phải, bot bên trái)
- Markdown support cho formatting
- Quick reply buttons (suggestions)
- Typing indicator
- Auto-scroll to bottom

### Features:
- Search history
- Clear history
- Export chat
- Voice input (optional)
- Dark mode

## 🔐 Security

- ✅ JWT Authentication required
- ✅ Context-aware (chỉ trả lời thông tin của user)
- ✅ Rate limiting (prevent spam)
- ✅ Input validation
- ✅ SQL injection protection (Prisma)

## 📈 Future Improvements

### Phase 1 (Current):
- ✅ Rule-based intent detection
- ✅ Template-based responses
- ✅ Context from database

### Phase 2 (Future):
- ⏸️ NLP integration (OpenAI GPT, Google Gemini)
- ⏸️ Multi-language support
- ⏸️ Voice input/output
- ⏸️ Sentiment analysis
- ⏸️ Learning from feedback

### Phase 3 (Advanced):
- ⏸️ Proactive notifications
- ⏸️ Personalized recommendations
- ⏸️ Integration with external systems
- ⏸️ Analytics dashboard

## 🧪 Testing

### Test với Swagger:
1. Mở http://localhost:3002/api/docs
2. Authorize với JWT token
3. Test endpoint `/chatbot/chat`
4. Thử các câu hỏi mẫu

### Test với curl:
```bash
curl -X POST http://localhost:3002/chatbot/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Tôi còn bao nhiêu ngày phép?"}'
```

## 📝 Notes

- Module hoạt động độc lập, không ảnh hưởng modules khác
- Có thể disable bằng cách comment import trong app.module.ts
- Dữ liệu chat history có thể xóa định kỳ (GDPR compliance)
- Response time < 500ms (database queries optimized)

---

**Version:** 1.0  
**Created:** 21/01/2026  
**Author:** Kiro AI
