# Chatbot AI - Kế Hoạch & Tình Trạng Triển Khai

## 📋 Tổng Quan Dự Án

Xây dựng hệ thống chatbot AI thông minh cho HRMS, giúp nhân viên và quản lý tra cứu thông tin nhanh chóng thông qua ngôn ngữ tự nhiên.

**Ngày bắt đầu**: 28/02/2026  
**Trạng thái hiện tại**: ✅ Phase 1 hoàn thành (LLM Integration)  
**Công nghệ**: OpenRouter API + xiaomi/mimo-v2-flash:free model

---

## 🎯 Mục Tiêu Dự Án

### Mục Tiêu Chính
1. ✅ Cung cấp trợ lý ảo 24/7 cho nhân viên
2. ✅ Giảm tải công việc cho bộ phận HR
3. ✅ Tăng trải nghiệm người dùng với giao diện thân thiện
4. ✅ Hỗ trợ đa vai trò (Employee, HR Manager, Admin)

### Mục Tiêu Kỹ Thuật
1. ✅ Tích hợp LLM để hiểu ngôn ngữ tự nhiên
2. ✅ Kết nối với database để truy xuất dữ liệu thực
3. ✅ Xây dựng hệ thống fallback đảm bảo độ tin cậy
4. ⏳ Tối ưu hiệu suất và chi phí API
5. ⏳ Mở rộng khả năng đa ngôn ngữ

---

## 📊 Kế Hoạch Triển Khai (Roadmap)

### ✅ Phase 1: LLM Integration (HOÀN THÀNH)
**Thời gian**: 28/02/2026  
**Trạng thái**: 100% hoàn thành

#### Công Việc Đã Hoàn Thành
- [x] Tạo LLMService để tích hợp OpenRouter API
- [x] Cấu hình API keys và environment variables
- [x] Xây dựng system prompt với context công ty
- [x] Xây dựng context prompt động từ database
- [x] Refactor ChatbotService để sử dụng LLM
- [x] Implement intelligent data fetching
- [x] Xây dựng hệ thống fallback rule-based
- [x] Tích hợp vào ChatbotModule
- [x] Testing và debugging
- [x] Build thành công cả backend và frontend

#### Tính Năng Đã Triển Khai
**Cho Nhân Viên (Employee)**:
- ✅ Tra cứu số dư phép năm
- ✅ Xem tổng kết chấm công
- ✅ Kiểm tra thông tin lương
- ✅ Theo dõi giờ tăng ca
- ✅ Xem trạng thái đơn nghỉ phép
- ✅ Hỏi về chính sách công ty

**Cho Quản Lý HR (HR Manager)**:
- ✅ Xem tổng chi lương công ty
- ✅ Thống kê số lượng nhân viên
- ✅ Cảnh báo hợp đồng sắp hết hạn
- ✅ Báo cáo thống kê phòng ban
- ✅ Báo cáo chấm công toàn công ty

**Cho Quản Trị Viên (Admin)**:
- ✅ Kiểm tra trạng thái hệ thống
- ✅ Xem hoạt động người dùng
- ✅ Truy cập audit logs
- ✅ Tất cả quyền của HR Manager

#### Kiến Trúc Kỹ Thuật
```
Frontend (ChatbotWidget)
    ↓
Backend API (/chatbot/chat)
    ↓
ChatbotService
    ├─→ fetchRelevantData() → Database
    ├─→ LLMService
    │   ├─→ buildSystemPrompt()
    │   ├─→ buildContextPrompt()
    │   └─→ OpenRouter API
    └─→ fallbackRuleBasedChat() (nếu LLM fail)
```

#### Files Đã Tạo/Sửa
1. **NEW**: `apps/backend/src/chatbot/llm.service.ts`
2. **MODIFIED**: `apps/backend/src/chatbot/chatbot.service.ts`
3. **MODIFIED**: `apps/backend/src/chatbot/chatbot.module.ts`
4. **MODIFIED**: `apps/backend/.env`
5. **EXISTING**: `apps/frontend/components/chatbot/ChatbotWidget.tsx`

---

### ⏳ Phase 2: UI/UX Enhancement (KẾ HOẠCH)
**Thời gian dự kiến**: Tuần 1-2, Tháng 3/2026  
**Trạng thái**: Chưa bắt đầu

#### Công Việc Cần Làm
- [ ] Cải thiện giao diện chat bubble
- [ ] Thêm typing indicator animation
- [ ] Hiển thị avatar cho bot và user
- [ ] Thêm quick reply buttons
- [ ] Implement rich message format (cards, lists)
- [ ] Thêm emoji reactions
- [ ] Dark mode support
- [ ] Responsive design cho mobile

#### Tính Năng Mới
- [ ] Gợi ý câu hỏi thông minh dựa trên context
- [ ] Hiển thị lịch sử chat theo session
- [ ] Bookmark câu trả lời quan trọng
- [ ] Share chat conversation
- [ ] Export chat history

---

### ⏳ Phase 3: Advanced Features (KẾ HOẠCH)
**Thời gian dự kiến**: Tuần 3-4, Tháng 3/2026  
**Trạng thái**: Chưa bắt đầu

#### Công Việc Cần Làm
- [ ] Multi-turn conversation tracking
- [ ] Context memory across sessions
- [ ] Intent classification improvement
- [ ] Entity extraction (dates, names, numbers)
- [ ] Sentiment analysis
- [ ] Proactive notifications
- [ ] Integration với notification system

#### Tính Năng Mới
- [ ] Chatbot có thể đặt câu hỏi làm rõ
- [ ] Nhớ preferences của user
- [ ] Gợi ý actions (tạo đơn, đăng ký phép)
- [ ] Tự động tóm tắt cuộc hội thoại
- [ ] Smart follow-up questions

---

### ⏳ Phase 4: Voice & Multilingual (KẾ HOẠCH)
**Thời gian dự kiến**: Tháng 4/2026  
**Trạng thái**: Chưa bắt đầu

#### Công Việc Cần Làm
- [ ] Voice input integration (Speech-to-Text)
- [ ] Voice output (Text-to-Speech)
- [ ] Multilingual support (Vietnamese + English)
- [ ] Language detection
- [ ] Translation service integration

#### Tính Năng Mới
- [ ] Voice commands
- [ ] Voice responses
- [ ] Chuyển đổi ngôn ngữ linh hoạt
- [ ] Accent support

---

### ⏳ Phase 5: Analytics & Optimization (KẾ HOẠCH)
**Thời gian dự kiến**: Tháng 5/2026  
**Trạng thái**: Chưa bắt đầu

#### Công Việc Cần Làm
- [ ] Analytics dashboard cho admin
- [ ] Track user engagement metrics
- [ ] Monitor LLM performance
- [ ] A/B testing framework
- [ ] Cost optimization
- [ ] Response quality scoring
- [ ] User feedback collection

#### Metrics Cần Theo Dõi
- [ ] Số lượng conversations/ngày
- [ ] Average response time
- [ ] User satisfaction score
- [ ] Intent detection accuracy
- [ ] Fallback rate
- [ ] API cost per conversation
- [ ] Most asked questions

---

## 📈 Tình Trạng Hiện Tại (Current Status)

### ✅ Đã Hoàn Thành

#### Backend
- ✅ **LLMService**: Tích hợp OpenRouter API hoàn chỉnh
- ✅ **ChatbotService**: Refactored với LLM + fallback system
- ✅ **Data Fetching**: Intelligent keyword-based data retrieval
- ✅ **Permission System**: Role-based access control
- ✅ **API Endpoints**: 
  - POST `/chatbot/chat` - Main chat endpoint
  - GET `/chatbot/history` - Chat history
  - GET `/chatbot/suggestions` - Quick suggestions

#### Frontend
- ✅ **ChatbotWidget**: Beautiful floating chat interface
- ✅ **Chat UI**: Bubble style messages với animations
- ✅ **Quick Suggestions**: Pre-defined question buttons
- ✅ **Typing Indicator**: Visual feedback khi bot đang trả lời
- ✅ **Integration**: Hiển thị trên tất cả dashboard pages

#### Database
- ✅ **ChatHistory Model**: Lưu trữ lịch sử chat
- ✅ **Data Access**: Kết nối với tất cả tables cần thiết

#### Configuration
- ✅ **Environment Variables**: API keys configured
- ✅ **Model Selection**: xiaomi/mimo-v2-flash:free
- ✅ **Parameters**: Temperature 0.7, Max tokens 1000

### 🔧 Đang Hoạt Động

#### Servers
- ✅ Backend: http://localhost:3333
- ✅ Frontend: http://localhost:3000
- ✅ API Docs: http://localhost:3333/api/docs

#### Features Live
1. **Natural Language Understanding**: Hiểu câu hỏi tiếng Việt tự nhiên
2. **Context-Aware Responses**: Trả lời dựa trên context và data thực
3. **Role-Based Access**: Phân quyền theo vai trò
4. **Conversation History**: Lưu và hiển thị lịch sử
5. **Fallback System**: Tự động chuyển sang rule-based nếu LLM fail

---

## 🎨 Giao Diện Người Dùng

### Chatbot Widget
```
┌─────────────────────────────────┐
│  💬 Trợ Lý HRMS          [−][×] │
├─────────────────────────────────┤
│                                 │
│  🤖 Xin chào! Tôi có thể giúp  │
│     gì cho bạn?                 │
│                                 │
│  👤 Tôi còn bao nhiêu ngày phép?│
│                                 │
│  🤖 📊 Thông tin phép năm 2026: │
│     • Tổng phép: 12 ngày        │
│     • Đã dùng: 3 ngày           │
│     • Còn lại: 9 ngày           │
│                                 │
├─────────────────────────────────┤
│  💬 Nhập tin nhắn...      [📎] │
└─────────────────────────────────┘
```

### Quick Suggestions
- "Tôi còn bao nhiêu ngày phép?"
- "Chấm công tháng này thế nào?"
- "Lương tháng này bao nhiêu?"
- "Quy định về giờ làm việc?"

---

## 🔐 Bảo Mật & Quyền Truy Cập

### Permission Levels

#### EMPLOYEE (Nhân viên)
- ✅ Xem dữ liệu cá nhân
- ✅ Hỏi về chính sách công khai
- ❌ Không xem dữ liệu người khác
- ❌ Không xem thống kê công ty

#### HR_MANAGER (Quản lý HR)
- ✅ Tất cả quyền của Employee
- ✅ Xem dữ liệu toàn công ty
- ✅ Xem thống kê và báo cáo
- ✅ Truy cập chính sách HR
- ❌ Không truy cập system logs

#### ADMIN (Quản trị viên)
- ✅ Tất cả quyền của HR Manager
- ✅ Xem system status
- ✅ Xem user activity
- ✅ Truy cập audit logs

### Data Security
- ✅ JWT authentication required
- ✅ Role-based access control
- ✅ Data filtering theo permissions
- ✅ Không lưu sensitive data trong logs
- ✅ API rate limiting (planned)

---

## 💰 Chi Phí & Tối Ưu

### Current Setup
- **Model**: xiaomi/mimo-v2-flash:free
- **Cost**: $0 (Free tier)
- **Limitations**: 
  - Rate limits theo free tier
  - Có thể có queue time
  - Không guarantee uptime

### Future Optimization Plans
1. **Caching**: Cache common responses
2. **Smart Routing**: Dùng rule-based cho simple queries
3. **Batch Processing**: Group multiple queries
4. **Model Selection**: Chọn model phù hợp với query complexity
5. **Fallback Strategy**: Multiple model fallbacks

---

## 📊 Metrics & KPIs

### Hiện Tại Đang Track
- ✅ Chat history count
- ✅ Response success rate
- ✅ Fallback usage rate

### Cần Track Thêm (Phase 5)
- ⏳ Average response time
- ⏳ User satisfaction score
- ⏳ Intent detection accuracy
- ⏳ API cost per conversation
- ⏳ Daily active users
- ⏳ Most common queries
- ⏳ Error rate by intent type

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Language**: Chỉ hỗ trợ tiếng Việt
2. **Context Window**: Chỉ giữ 5 messages gần nhất
3. **No Voice**: Chưa hỗ trợ voice input/output
4. **No Proactive**: Chưa có proactive notifications
5. **Simple Fallback**: Fallback system còn đơn giản

### Planned Fixes
- [ ] Expand context window
- [ ] Add English support
- [ ] Improve fallback intelligence
- [ ] Add voice capabilities
- [ ] Implement proactive features

---

## 🚀 Cách Sử Dụng

### Cho Nhân Viên
1. Click vào icon chatbot ở góc phải màn hình
2. Gõ câu hỏi bằng tiếng Việt tự nhiên
3. Hoặc chọn câu hỏi gợi ý
4. Nhận câu trả lời ngay lập tức

### Ví Dụ Câu Hỏi
```
✅ "Tôi còn bao nhiêu ngày phép?"
✅ "Chấm công tháng này của tôi thế nào?"
✅ "Lương tháng 12 bao nhiêu?"
✅ "Quy định về tăng ca là gì?"
✅ "Tôi đã tăng ca bao nhiêu giờ?"
✅ "Trạng thái đơn nghỉ phép của tôi?"
```

### Cho HR Manager
```
✅ "Tổng chi lương tháng này bao nhiêu?"
✅ "Có bao nhiêu nhân viên đang làm việc?"
✅ "Hợp đồng nào sắp hết hạn?"
✅ "Thống kê chấm công toàn công ty?"
```

---

## 📝 Technical Specifications

### Backend Stack
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma)
- **LLM Provider**: OpenRouter
- **Model**: xiaomi/mimo-v2-flash:free
- **HTTP Client**: Axios

### Frontend Stack
- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI Library**: React
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

### API Configuration
```typescript
{
  model: "xiaomi/mimo-v2-flash:free",
  temperature: 0.7,
  max_tokens: 1000,
  baseURL: "https://openrouter.ai/api/v1"
}
```

### System Prompt Structure
```
1. User Context (role, employeeId, current time)
2. Company Policies (work hours, leave, overtime, salary)
3. Response Guidelines (format, tone, language)
4. Security Rules (data access, topic restrictions)
```

---

## 🔄 Quy Trình Phát Triển

### Development Workflow
1. **Planning**: Định nghĩa requirements
2. **Design**: Thiết kế architecture
3. **Implementation**: Code features
4. **Testing**: Unit + Integration tests
5. **Review**: Code review
6. **Deploy**: Deploy to staging
7. **QA**: User acceptance testing
8. **Production**: Deploy to production
9. **Monitor**: Track metrics và errors

### Git Workflow
```
main (production)
  ↑
develop (staging)
  ↑
feature/chatbot-* (development)
```

---

## 📚 Tài Liệu Tham Khảo

### Internal Docs
- `docs/CHATBOT-IMPLEMENTATION.md` - Chi tiết implementation
- `docs/CHATBOT-LLM-INTEGRATION.md` - LLM integration guide
- `apps/backend/src/chatbot/README.md` - Backend chatbot docs

### External Resources
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [xiaomi/mimo-v2 Model Card](https://openrouter.ai/models/xiaomi/mimo-v2-flash)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 👥 Team & Responsibilities

### Current Team
- **Backend Developer**: LLM integration, API development
- **Frontend Developer**: UI/UX, widget implementation
- **DevOps**: Deployment, monitoring
- **QA**: Testing, bug reporting

### Future Needs
- **ML Engineer**: Model fine-tuning, optimization
- **UX Designer**: Advanced UI/UX improvements
- **Data Analyst**: Analytics dashboard

---

## 📅 Timeline Summary

| Phase | Timeline | Status | Completion |
|-------|----------|--------|------------|
| Phase 1: LLM Integration | 28/02/2026 | ✅ Done | 100% |
| Phase 2: UI/UX Enhancement | Week 1-2, Mar 2026 | ⏳ Planned | 0% |
| Phase 3: Advanced Features | Week 3-4, Mar 2026 | ⏳ Planned | 0% |
| Phase 4: Voice & Multilingual | Apr 2026 | ⏳ Planned | 0% |
| Phase 5: Analytics & Optimization | May 2026 | ⏳ Planned | 0% |

---

## ✅ Kết Luận

### Thành Tựu Hiện Tại
Phase 1 đã hoàn thành thành công với tất cả tính năng core:
- ✅ LLM integration hoạt động tốt
- ✅ UI/UX đẹp và thân thiện
- ✅ Role-based access control chặt chẽ
- ✅ Fallback system đảm bảo reliability
- ✅ Build và deploy thành công

### Kế Hoạch Tiếp Theo
1. **Ngắn hạn** (1-2 tuần): UI/UX enhancements
2. **Trung hạn** (1 tháng): Advanced features
3. **Dài hạn** (2-3 tháng): Voice, multilingual, analytics

### Rủi Ro & Giảm Thiểu
- **API Downtime**: Có fallback system
- **Cost Overrun**: Sử dụng free tier, có caching plan
- **Performance**: Có optimization roadmap
- **Security**: Đã implement access control

---

**Cập nhật lần cuối**: 28/02/2026  
**Người cập nhật**: Development Team  
**Phiên bản**: 1.0
