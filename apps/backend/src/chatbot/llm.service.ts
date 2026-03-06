import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ModelConfig {
    name: string;
    id: string;
    provider: string;
    priority: number;
}

@Injectable()
export class LLMService {
    private readonly logger = new Logger(LLMService.name);
    private readonly apiKey: string;
    private readonly baseURL: string;
    private currentModelIndex = 0;

    // List of free models in priority order
    private readonly freeModels: ModelConfig[] = [
        {
            name: 'GPT OSS 120B',
            id: 'openai/gpt-oss-120b:free',
            provider: 'OpenAI',
            priority: 1,
        },
        {
            name: 'MiMo V2 Flash',
            id: 'xiaomi/mimo-v2-flash:free',
            provider: 'Xiaomi',
            priority: 2,
        },
        {
            name: 'Gemini 2.0 Flash',
            id: 'google/gemini-2.0-flash-exp:free',
            provider: 'Google',
            priority: 3,
        },
        {
            name: 'Llama 3.3 70B',
            id: 'meta-llama/llama-3.3-70b-instruct:free',
            provider: 'Meta',
            priority: 4,
        },
        {
            name: 'Mistral Small 3.1',
            id: 'mistralai/mistral-small-3.1:free',
            provider: 'Mistral',
            priority: 5,
        },
        {
            name: 'Llama 3.1 405B',
            id: 'meta-llama/llama-3.1-405b-instruct:free',
            provider: 'Meta',
            priority: 6,
        },
        {
            name: 'DeepSeek R1',
            id: 'deepseek/deepseek-r1:free',
            provider: 'DeepSeek',
            priority: 7,
        },
    ];

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
        this.baseURL = this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';
    }

    async chat(messages: LLMMessage[], context?: any): Promise<string> {
        // Try each model in order until one succeeds
        for (let i = 0; i < this.freeModels.length; i++) {
            const modelIndex = (this.currentModelIndex + i) % this.freeModels.length;
            const model = this.freeModels[modelIndex];

            try {
                this.logger.log(`Trying model: ${model.name} (${model.provider})`);

                const response = await axios.post(
                    `${this.baseURL}/chat/completions`,
                    {
                        model: model.id,
                        messages,
                        temperature: 0.7,
                        max_tokens: 1000,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://hrms.company.com',
                            'X-Title': 'HRMS Chatbot',
                        },
                        timeout: 30000, // 30 second timeout
                    }
                );

                const content = response.data.choices[0]?.message?.content;
                if (!content) {
                    throw new Error('No response from LLM');
                }

                // Success! Update current model index for next request
                this.currentModelIndex = modelIndex;
                this.logger.log(`✅ Success with ${model.name}`);

                return content.trim();
            } catch (error) {
                const errorMsg = error.response?.data?.error?.message || error.message;
                const statusCode = error.response?.status;

                this.logger.warn(
                    `❌ ${model.name} failed (${statusCode || 'timeout'}): ${errorMsg}`
                );

                // If this is the last model, throw error
                if (i === this.freeModels.length - 1) {
                    this.logger.error('All models failed. Throwing error.');
                    throw new Error('Không thể kết nối với AI. Vui lòng thử lại sau.');
                }

                // Otherwise, continue to next model
                this.logger.log(`Trying next model...`);
            }
        }

        // Should never reach here, but just in case
        throw new Error('Không thể kết nối với AI. Vui lòng thử lại sau.');
    }

    // Get current active model info
    getCurrentModel(): ModelConfig {
        return this.freeModels[this.currentModelIndex];
    }

    // Get all available models
    getAvailableModels(): ModelConfig[] {
        return this.freeModels;
    }

    buildSystemPrompt(context: any): string {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        return `Bạn là trợ lý ảo thông minh của hệ thống quản lý nhân sự (HRMS) tại công ty.

**THÔNG TIN NGƯỜI DÙNG:**
- Employee ID: ${context.employeeId || 'N/A'}
- Role: ${context.role || 'EMPLOYEE'}
- Thời gian hiện tại: ${now.toLocaleString('vi-VN')}
- Tháng hiện tại: ${currentMonth}/${currentYear}

**NHIỆM VỤ CỦA BẠN:**
1. Trả lời câu hỏi về thông tin nhân viên, chấm công, lương, phép năm, tăng ca
2. Giải thích chính sách công ty một cách rõ ràng
3. Hướng dẫn nhân viên sử dụng hệ thống
4. Luôn lịch sự, thân thiện và chuyên nghiệp

**QUY TẮC QUAN TRỌNG:**
- LUÔN ƯU TIÊN sử dụng dữ liệu từ "DỮ LIỆU TỪ HỆ THỐNG" nếu có
- Nếu có dữ liệu employeeStats, hãy trả lời CHÍNH XÁC số lượng nhân viên
- Nếu có dữ liệu companySalary, hãy trả lời CHÍNH XÁC tổng lương
- Nếu có dữ liệu expiringContracts, hãy liệt kê các hợp đồng sắp hết hạn
- Chỉ trả lời về thông tin CÔNG TY và NHÂN SỰ
- KHÔNG trả lời về chính trị, tôn giáo, hoặc chủ đề nhạy cảm
- Nếu không có dữ liệu trong hệ thống, hãy thừa nhận và đề xuất liên hệ HR
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Sử dụng emoji phù hợp để thân thiện hơn
- Format câu trả lời với markdown (**, •, \n\n)

**CHÍNH SÁCH CÔNG TY:**
- Giờ làm việc: 8:30-17:30 (T2-T6)
- Phép năm: 12 ngày/năm (tích lũy 1 ngày/tháng)
- Phép bệnh: 30 ngày/năm
- Tăng ca: Tối đa 30h/tháng, hệ số 150%
- Ngày trả lương: Ngày 5 hàng tháng
- BHXH: 10.5% (trần 36 triệu)
- Thuế TNCN: Lũy tiến 5-35%

**CÁCH TRẢ LỜI:**
- Nếu hỏi về phép năm → Cung cấp số dư phép cụ thể từ dữ liệu
- Nếu hỏi về lương → Giải thích các thành phần lương từ dữ liệu
- Nếu hỏi về chấm công → Tổng kết số ngày, giờ làm việc từ dữ liệu
- Nếu hỏi về số lượng nhân viên → Trả lời CHÍNH XÁC từ employeeStats
- Nếu hỏi về chính sách → Giải thích rõ ràng, dễ hiểu

Hãy trả lời câu hỏi của nhân viên một cách chính xác và hữu ích!`;
    }

    buildContextPrompt(data: any): string {
        if (!data) return '';

        let prompt = '\n\n**DỮ LIỆU TỪ HỆ THỐNG:**\n';

        // Employee statistics (for HR/ADMIN)
        if (data.employeeStats) {
            prompt += `\n👥 **THỐNG KÊ NHÂN VIÊN:**\n`;
            prompt += `- Tổng số nhân viên: **${data.employeeStats.total}** người\n`;
            prompt += `- Đang làm việc (ACTIVE): **${data.employeeStats.active}** người\n`;
            prompt += `- Đã nghỉ việc (INACTIVE): **${data.employeeStats.inactive}** người\n`;
            prompt += `\n⚠️ QUAN TRỌNG: Hãy sử dụng số liệu này để trả lời câu hỏi về số lượng nhân viên!\n`;
        }

        // Company salary (for HR/ADMIN)
        if (data.companySalary) {
            prompt += `\n💰 **TỔNG LƯƠNG CÔNG TY tháng ${data.companySalary.month}/${data.companySalary.year}:**\n`;
            prompt += `- Tổng chi phí: **${data.companySalary.totalAmount.toLocaleString('vi-VN')} VNĐ**\n`;
            prompt += `- Số nhân viên: **${data.companySalary.employeeCount}** người\n`;
            prompt += `- Trạng thái: ${data.companySalary.status}\n`;
        }

        // Expiring contracts (for HR/ADMIN)
        if (data.expiringContracts && data.expiringContracts.length > 0) {
            prompt += `\n⚠️ **HỢP ĐỒNG SẮP HẾT HẠN (30 ngày tới):**\n`;
            prompt += `Tổng số: **${data.expiringContracts.length}** hợp đồng\n\n`;
            data.expiringContracts.forEach((c: any, i: number) => {
                prompt += `${i + 1}. ${c.employeeName} (${c.employeeCode}) - ${c.contractType}\n`;
                prompt += `   Hết hạn: ${c.endDate}\n`;
            });
        }

        if (data.leaveBalance) {
            prompt += `\n📅 Phép năm ${data.leaveBalance.year}:\n`;
            prompt += `- Tổng phép: ${data.leaveBalance.annualLeave} ngày\n`;
            prompt += `- Đã dùng: ${data.leaveBalance.usedAnnual} ngày\n`;
            prompt += `- Còn lại: ${Number(data.leaveBalance.annualLeave) - Number(data.leaveBalance.usedAnnual)} ngày\n`;
            prompt += `- Phép bệnh: ${data.leaveBalance.sickLeave} ngày (đã dùng: ${data.leaveBalance.usedSick})\n`;
        }

        if (data.attendance) {
            prompt += `\n⏰ Chấm công tháng ${data.attendance.month}/${data.attendance.year}:\n`;
            prompt += `- Số ngày đi làm: ${data.attendance.present} ngày\n`;
            prompt += `- Đi muộn: ${data.attendance.late} lần\n`;
            prompt += `- Về sớm: ${data.attendance.earlyLeave} lần\n`;
            prompt += `- Tổng giờ: ${data.attendance.totalHours} giờ\n`;
        }

        if (data.salary) {
            prompt += `\n💰 Lương tháng ${data.salary.month}/${data.salary.year}:\n`;
            prompt += `- Lương cơ bản: ${data.salary.baseSalary.toLocaleString('vi-VN')} VNĐ\n`;
            prompt += `- Phụ cấp: ${data.salary.allowances.toLocaleString('vi-VN')} VNĐ\n`;
            prompt += `- Thưởng: ${data.salary.bonus.toLocaleString('vi-VN')} VNĐ\n`;
            prompt += `- Tăng ca: ${data.salary.overtimePay.toLocaleString('vi-VN')} VNĐ\n`;
            prompt += `- BHXH: ${data.salary.insurance.toLocaleString('vi-VN')} VNĐ\n`;
            prompt += `- Thuế: ${data.salary.tax.toLocaleString('vi-VN')} VNĐ\n`;
            prompt += `- Thực lãnh: ${data.salary.netSalary.toLocaleString('vi-VN')} VNĐ\n`;
        }

        if (data.overtime) {
            prompt += `\n⏱️ Tăng ca tháng ${data.overtime.month}/${data.overtime.year}:\n`;
            prompt += `- Tổng giờ: ${data.overtime.totalHours} giờ\n`;
            prompt += `- Đã duyệt: ${data.overtime.approved} đơn\n`;
            prompt += `- Chờ duyệt: ${data.overtime.pending} đơn\n`;
            prompt += `- Còn lại: ${30 - data.overtime.totalHours} giờ (giới hạn 30h/tháng)\n`;
        }

        if (data.employee) {
            prompt += `\n👤 Thông tin nhân viên:\n`;
            prompt += `- Mã NV: ${data.employee.employeeCode}\n`;
            prompt += `- Họ tên: ${data.employee.fullName}\n`;
            prompt += `- Chức vụ: ${data.employee.position}\n`;
            prompt += `- Phòng ban: ${data.employee.department}\n`;
            prompt += `- Email: ${data.employee.email}\n`;
        }

        if (data.leaveRequests) {
            prompt += `\n📝 Đơn nghỉ phép gần đây:\n`;
            data.leaveRequests.forEach((req: any, index: number) => {
                const statusIcon = req.status === 'APPROVED' ? '✅' : req.status === 'REJECTED' ? '❌' : '⏳';
                prompt += `${index + 1}. ${statusIcon} ${req.leaveType} - ${req.startDate} đến ${req.endDate} (${req.totalDays} ngày)\n`;
            });
        }

        if (data.knowledgeBase && data.knowledgeBase.length > 0) {
            prompt += `\n\n📚 **KIẾN THỨC CÔNG TY (từ Knowledge Base):**\n`;
            prompt += `Dưới đây là các tài liệu liên quan đến câu hỏi:\n\n`;
            data.knowledgeBase.forEach((kb: any, index: number) => {
                prompt += `${index + 1}. **${kb.title}** (${kb.category}) - Độ liên quan: ${(kb.similarity * 100).toFixed(1)}%\n`;
                prompt += `${kb.content}\n\n`;
            });
            prompt += `\nHãy sử dụng thông tin từ Knowledge Base để trả lời câu hỏi một cách chính xác.\n`;
        }

        return prompt;
    }
}
