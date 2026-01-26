import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatContext {
  employeeId?: string;
  departmentId?: string;
  role?: string;
}

@Injectable()
export class ChatbotService {
  constructor(private prisma: PrismaService) {}

  async chat(message: string, context: ChatContext, history: ChatMessage[] = []) {
    // Phân tích intent từ message
    const intent = await this.detectIntent(message);
    
    // Xử lý theo intent
    let response: string;
    let data: any = null;

    switch (intent.type) {
      case 'LEAVE_BALANCE':
        response = await this.handleLeaveBalanceQuery(context);
        break;
      
      case 'ATTENDANCE_SUMMARY':
        response = await this.handleAttendanceSummary(context, intent.params);
        break;
      
      case 'SALARY_INFO':
        response = await this.handleSalaryInfo(context, intent.params);
        break;
      
      case 'COMPANY_POLICY':
        response = await this.handleCompanyPolicy(intent.params);
        break;
      
      case 'EMPLOYEE_INFO':
        response = await this.handleEmployeeInfo(context, intent.params);
        break;
      
      case 'DEPARTMENT_INFO':
        response = await this.handleDepartmentInfo(intent.params);
        break;
      
      case 'LEAVE_REQUEST_STATUS':
        response = await this.handleLeaveRequestStatus(context);
        break;
      
      case 'OVERTIME_INFO':
        response = await this.handleOvertimeInfo(context, intent.params);
        break;
      
      case 'GREETING':
        response = this.handleGreeting(context);
        break;
      
      case 'HELP':
        response = this.handleHelp();
        break;
      
      default:
        response = this.handleUnknown(message);
    }

    return {
      success: true,
      data: {
        message: response,
        intent: intent.type,
        additionalData: data,
      },
    };
  }

  private async detectIntent(message: string): Promise<{ type: string; params: any }> {
    const lowerMessage = message.toLowerCase();

    // Leave balance queries
    if (lowerMessage.match(/phép|nghỉ phép|số ngày phép|còn bao nhiêu phép/)) {
      return { type: 'LEAVE_BALANCE', params: {} };
    }

    // Attendance queries
    if (lowerMessage.match(/chấm công|đi làm|công|attendance/)) {
      const monthMatch = lowerMessage.match(/tháng (\d+)/);
      return { 
        type: 'ATTENDANCE_SUMMARY', 
        params: { month: monthMatch ? parseInt(monthMatch[1]) : null }
      };
    }

    // Salary queries
    if (lowerMessage.match(/lương|salary|thu nhập|payroll/)) {
      const monthMatch = lowerMessage.match(/tháng (\d+)/);
      return { 
        type: 'SALARY_INFO', 
        params: { month: monthMatch ? parseInt(monthMatch[1]) : null }
      };
    }

    // Company policy
    if (lowerMessage.match(/quy định|chính sách|policy|nội quy/)) {
      return { type: 'COMPANY_POLICY', params: { topic: lowerMessage } };
    }

    // Employee info
    if (lowerMessage.match(/nhân viên|employee|thông tin/)) {
      return { type: 'EMPLOYEE_INFO', params: {} };
    }

    // Department info
    if (lowerMessage.match(/phòng ban|department|bộ phận/)) {
      return { type: 'DEPARTMENT_INFO', params: {} };
    }

    // Leave request status
    if (lowerMessage.match(/đơn nghỉ|đơn phép|leave request|trạng thái đơn/)) {
      return { type: 'LEAVE_REQUEST_STATUS', params: {} };
    }

    // Overtime info
    if (lowerMessage.match(/tăng ca|overtime|làm thêm/)) {
      const monthMatch = lowerMessage.match(/tháng (\d+)/);
      return { 
        type: 'OVERTIME_INFO', 
        params: { month: monthMatch ? parseInt(monthMatch[1]) : null }
      };
    }

    // Greeting
    if (lowerMessage.match(/^(xin chào|chào|hello|hi|hey)/)) {
      return { type: 'GREETING', params: {} };
    }

    // Help
    if (lowerMessage.match(/help|trợ giúp|hướng dẫn|giúp/)) {
      return { type: 'HELP', params: {} };
    }

    return { type: 'UNKNOWN', params: {} };
  }

  private async handleLeaveBalanceQuery(context: ChatContext): Promise<string> {
    if (!context.employeeId) {
      return 'Xin lỗi, tôi không thể xác định thông tin nhân viên của bạn.';
    }

    const year = new Date().getFullYear();
    const balance = await this.prisma.leaveBalance.findFirst({
      where: { employeeId: context.employeeId, year },
    });

    if (!balance) {
      return `Bạn chưa có thông tin số dư phép năm ${year}.`;
    }

    const remaining = Number(balance.annualLeave) - Number(balance.usedAnnual);
    
    return `📊 **Thông tin phép năm ${year}:**\n\n` +
           `• Tổng phép năm: ${balance.annualLeave} ngày\n` +
           `• Đã sử dụng: ${balance.usedAnnual} ngày\n` +
           `• Còn lại: ${remaining} ngày\n` +
           `• Phép bệnh: ${balance.sickLeave} ngày (đã dùng: ${balance.usedSick})`;
  }

  private async handleAttendanceSummary(context: ChatContext, params: any): Promise<string> {
    if (!context.employeeId) {
      return 'Xin lỗi, tôi không thể xác định thông tin nhân viên của bạn.';
    }

    const now = new Date();
    const month = params.month || now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId: context.employeeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const late = attendances.filter(a => a.isLate).length;
    const earlyLeave = attendances.filter(a => a.isEarlyLeave).length;
    const totalHours = attendances.reduce((sum, a) => sum + Number(a.workHours || 0), 0);

    return `📅 **Tổng kết chấm công tháng ${month}/${year}:**\n\n` +
           `• Số ngày đi làm: ${present} ngày\n` +
           `• Số lần đi muộn: ${late} lần\n` +
           `• Số lần về sớm: ${earlyLeave} lần\n` +
           `• Tổng giờ làm việc: ${totalHours.toFixed(1)} giờ\n` +
           `• Trung bình: ${(totalHours / present || 0).toFixed(1)} giờ/ngày`;
  }

  private async handleSalaryInfo(context: ChatContext, params: any): Promise<string> {
    if (!context.employeeId) {
      return 'Xin lỗi, tôi không thể xác định thông tin nhân viên của bạn.';
    }

    const now = new Date();
    const month = params.month || now.getMonth() + 1;
    const year = now.getFullYear();

    const payroll = await this.prisma.payroll.findFirst({
      where: { month, year },
      include: {
        items: {
          where: { employeeId: context.employeeId },
        },
      },
    });

    if (!payroll || payroll.items.length === 0) {
      return `Chưa có thông tin lương tháng ${month}/${year}.`;
    }

    const item = payroll.items[0];

    return `💰 **Thông tin lương tháng ${month}/${year}:**\n\n` +
           `• Lương cơ bản: ${Number(item.baseSalary).toLocaleString('vi-VN')} VNĐ\n` +
           `• Phụ cấp: ${Number(item.allowances).toLocaleString('vi-VN')} VNĐ\n` +
           `• Thưởng: ${Number(item.bonus).toLocaleString('vi-VN')} VNĐ\n` +
           `• Tăng ca: ${Number(item.overtimePay).toLocaleString('vi-VN')} VNĐ\n` +
           `• Khấu trừ: ${Number(item.deduction).toLocaleString('vi-VN')} VNĐ\n` +
           `• BHXH: ${Number(item.insurance).toLocaleString('vi-VN')} VNĐ\n` +
           `• Thuế TNCN: ${Number(item.tax).toLocaleString('vi-VN')} VNĐ\n` +
           `• **Thực lãnh: ${Number(item.netSalary).toLocaleString('vi-VN')} VNĐ**\n\n` +
           `Trạng thái: ${payroll.status === 'FINALIZED' ? '✅ Đã chốt' : '⏳ Đang xử lý'}`;
  }

  private handleCompanyPolicy(params: any): string {
    const policies = {
      'giờ làm việc': '⏰ **Giờ làm việc:**\n• Sáng: 8:30 - 12:00\n• Chiều: 13:00 - 17:30\n• Thứ 2 - Thứ 6',
      'nghỉ phép': '📅 **Chính sách nghỉ phép:**\n• Phép năm: 12 ngày/năm\n• Tích lũy: 1 ngày/tháng\n• Phép bệnh: 30 ngày/năm\n• Đăng ký trước: 3 ngày (phép năm)',
      'tăng ca': '⏱️ **Chính sách tăng ca:**\n• Tối đa: 30 giờ/tháng, 200 giờ/năm\n• Hệ số: 150% lương giờ\n• Thời gian: Ngoài giờ hành chính',
      'lương': '💰 **Chính sách lương:**\n• Ngày trả lương: 5 hàng tháng\n• BHXH: 10.5% (cap 36M)\n• Thuế TNCN: Lũy tiến 5-35%\n• Giảm trừ: 11M/người',
    };

    const topic = params.topic.toLowerCase();
    for (const [key, value] of Object.entries(policies)) {
      if (topic.includes(key)) {
        return value;
      }
    }

    return '📋 **Các chính sách công ty:**\n\n' +
           '1. Giờ làm việc: 8:30-17:30 (T2-T6)\n' +
           '2. Nghỉ phép: 12 ngày/năm\n' +
           '3. Tăng ca: Tối đa 30h/tháng\n' +
           '4. Lương: Trả vào ngày 5 hàng tháng\n\n' +
           'Hỏi cụ thể hơn để biết chi tiết!';
  }

  private async handleEmployeeInfo(context: ChatContext, params: any): Promise<string> {
    if (!context.employeeId) {
      return 'Xin lỗi, tôi không thể xác định thông tin nhân viên của bạn.';
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: context.employeeId },
      include: {
        department: true,
        contracts: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!employee) {
      return 'Không tìm thấy thông tin nhân viên.';
    }

    return `👤 **Thông tin nhân viên:**\n\n` +
           `• Mã NV: ${employee.employeeCode}\n` +
           `• Họ tên: ${employee.fullName}\n` +
           `• Chức vụ: ${employee.position}\n` +
           `• Phòng ban: ${employee.department.name}\n` +
           `• Email: ${employee.email}\n` +
           `• Ngày vào: ${employee.startDate.toLocaleDateString('vi-VN')}\n` +
           `• Trạng thái: ${employee.status}`;
  }

  private async handleDepartmentInfo(params: any): Promise<string> {
    const departments = await this.prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    let response = '🏢 **Danh sách phòng ban:**\n\n';
    departments.forEach(dept => {
      response += `• ${dept.name} (${dept.code}): ${dept._count.employees} nhân viên\n`;
    });

    return response;
  }

  private async handleLeaveRequestStatus(context: ChatContext): Promise<string> {
    if (!context.employeeId) {
      return 'Xin lỗi, tôi không thể xác định thông tin nhân viên của bạn.';
    }

    const requests = await this.prisma.leaveRequest.findMany({
      where: { employeeId: context.employeeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (requests.length === 0) {
      return 'Bạn chưa có đơn nghỉ phép nào.';
    }

    let response = '📝 **Đơn nghỉ phép gần đây:**\n\n';
    requests.forEach((req, index) => {
      const statusIcon = req.status === 'APPROVED' ? '✅' : 
                        req.status === 'REJECTED' ? '❌' : '⏳';
      response += `${index + 1}. ${statusIcon} ${req.leaveType} - ` +
                  `${req.startDate.toLocaleDateString('vi-VN')} đến ` +
                  `${req.endDate.toLocaleDateString('vi-VN')} ` +
                  `(${req.totalDays} ngày) - ${req.status}\n`;
    });

    return response;
  }

  private async handleOvertimeInfo(context: ChatContext, params: any): Promise<string> {
    if (!context.employeeId) {
      return 'Xin lỗi, tôi không thể xác định thông tin nhân viên của bạn.';
    }

    const now = new Date();
    const month = params.month || now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const overtimes = await this.prisma.overtimeRequest.findMany({
      where: {
        employeeId: context.employeeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    const approved = overtimes.filter(o => o.status === 'APPROVED');
    const totalHours = approved.reduce((sum, o) => sum + Number(o.hours), 0);

    return `⏱️ **Thông tin tăng ca tháng ${month}/${year}:**\n\n` +
           `• Tổng số giờ: ${totalHours} giờ\n` +
           `• Số đơn đã duyệt: ${approved.length}\n` +
           `• Số đơn chờ duyệt: ${overtimes.filter(o => o.status === 'PENDING').length}\n` +
           `• Giới hạn tháng: 30 giờ\n` +
           `• Còn lại: ${Math.max(0, 30 - totalHours)} giờ`;
  }

  private handleGreeting(context: ChatContext): string {
    const hour = new Date().getHours();
    let greeting = 'Xin chào';
    
    if (hour < 12) greeting = 'Chào buổi sáng';
    else if (hour < 18) greeting = 'Chào buổi chiều';
    else greeting = 'Chào buổi tối';

    return `${greeting}! 👋\n\n` +
           'Tôi là trợ lý ảo của hệ thống HRMS. Tôi có thể giúp bạn:\n\n' +
           '• Kiểm tra số dư phép\n' +
           '• Xem tổng kết chấm công\n' +
           '• Tra cứu thông tin lương\n' +
           '• Hỏi về chính sách công ty\n' +
           '• Kiểm tra trạng thái đơn từ\n\n' +
           'Bạn cần tôi giúp gì?';
  }

  private handleHelp(): string {
    return '❓ **Hướng dẫn sử dụng:**\n\n' +
           '**Câu hỏi mẫu:**\n' +
           '• "Tôi còn bao nhiêu ngày phép?"\n' +
           '• "Chấm công tháng này của tôi thế nào?"\n' +
           '• "Lương tháng 12 của tôi bao nhiêu?"\n' +
           '• "Quy định về giờ làm việc?"\n' +
           '• "Tôi đã tăng ca bao nhiêu giờ?"\n' +
           '• "Trạng thái đơn nghỉ phép của tôi?"\n\n' +
           '**Chủ đề hỗ trợ:**\n' +
           '✅ Phép năm & nghỉ phép\n' +
           '✅ Chấm công & tăng ca\n' +
           '✅ Lương & thuế\n' +
           '✅ Chính sách công ty\n' +
           '✅ Thông tin nhân viên';
  }

  private handleUnknown(message: string): string {
    return '🤔 Xin lỗi, tôi chưa hiểu câu hỏi của bạn.\n\n' +
           'Bạn có thể hỏi về:\n' +
           '• Phép năm (số ngày phép còn lại)\n' +
           '• Chấm công (tổng kết tháng)\n' +
           '• Lương (thông tin lương tháng)\n' +
           '• Chính sách công ty\n' +
           '• Tăng ca (số giờ tăng ca)\n\n' +
           'Hoặc gõ "help" để xem hướng dẫn chi tiết.';
  }

  // Save chat history
  async saveChatHistory(employeeId: string, message: string, response: string) {
    await this.prisma.chatHistory.create({
      data: {
        employeeId,
        userMessage: message,
        botResponse: response,
      },
    });
  }

  // Get chat history
  async getChatHistory(employeeId: string, limit: number = 10) {
    return this.prisma.chatHistory.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
