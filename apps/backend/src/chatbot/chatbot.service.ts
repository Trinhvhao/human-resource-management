import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMService } from './llm.service';
import { KnowledgeService } from './knowledge.service';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatContext {
  employeeId?: string;
  departmentId?: string;
  role?: string;
}

enum Permission {
  VIEW_OWN_DATA = 'VIEW_OWN_DATA',
  VIEW_PUBLIC_POLICY = 'VIEW_PUBLIC_POLICY',
  VIEW_ALL_DATA = 'VIEW_ALL_DATA',
  VIEW_STATISTICS = 'VIEW_STATISTICS',
  VIEW_HR_POLICY = 'VIEW_HR_POLICY',
  VIEW_SYSTEM = 'VIEW_SYSTEM',
  VIEW_AUDIT = 'VIEW_AUDIT',
}

@Injectable()
export class ChatbotService {
  constructor(
    private prisma: PrismaService,
    private llmService: LLMService,
    private knowledgeService: KnowledgeService,
  ) { }

  async chat(message: string, context: ChatContext, history: ChatMessage[] = []) {
    try {
      // Search knowledge base using RAG first
      const knowledgeResults = await this.knowledgeService.search(message, 3);

      // Fetch relevant data from database based on message content
      const data = await this.fetchRelevantData(message, context);

      // Add knowledge base results to data
      if (knowledgeResults.length > 0) {
        data.knowledgeBase = knowledgeResults.map(r => ({
          title: r.title,
          content: r.content,
          category: r.category,
          similarity: r.similarity,
        }));
      }

      // If no employee data but have knowledge base, still try LLM
      if (!context.employeeId && knowledgeResults.length > 0) {
        // Build system prompt with company context
        const systemPrompt = this.llmService.buildSystemPrompt(context);

        // Build context prompt with knowledge base only
        const contextPrompt = this.llmService.buildContextPrompt(data);

        // Prepare messages for LLM
        const messages: ChatMessage[] = [
          { role: 'system', content: systemPrompt + contextPrompt },
          ...history.slice(-5),
          { role: 'user', content: message },
        ];

        try {
          // Call LLM
          const response = await this.llmService.chat(messages, context);

          return {
            success: true,
            data: {
              message: response,
              intent: 'LLM_RESPONSE',
              additionalData: data,
            },
          };
        } catch (llmError) {
          // If LLM fails, return knowledge base directly
          return this.buildKnowledgeBaseResponse(knowledgeResults, message);
        }
      }

      // Build system prompt with company context
      const systemPrompt = this.llmService.buildSystemPrompt(context);

      // Build context prompt with fetched data
      const contextPrompt = this.llmService.buildContextPrompt(data);

      // Prepare messages for LLM
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt + contextPrompt },
        ...history.slice(-5), // Keep last 5 messages for context
        { role: 'user', content: message },
      ];

      // Call LLM
      const response = await this.llmService.chat(messages, context);

      return {
        success: true,
        data: {
          message: response,
          intent: 'LLM_RESPONSE',
          additionalData: data,
        },
      };
    } catch (error) {
      // Fallback to rule-based if LLM fails
      return this.fallbackRuleBasedChat(message, context, history);
    }
  }

  // Build response directly from knowledge base
  private buildKnowledgeBaseResponse(knowledgeResults: any[], query: string) {
    if (knowledgeResults.length === 0) {
      return {
        success: true,
        data: {
          message: '❓ Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn.\n\nBạn có thể:\n• Hỏi về chính sách công ty\n• Hỏi về quy trình làm việc\n• Liên hệ HR: hr@company.com',
          intent: 'NO_KNOWLEDGE',
          additionalData: null,
        },
      };
    }

    const topResult = knowledgeResults[0];
    let response = `📚 **${topResult.title}**\n\n`;
    response += `${topResult.content}\n\n`;

    if (knowledgeResults.length > 1) {
      response += `\n**Xem thêm:**\n`;
      knowledgeResults.slice(1).forEach((r, i) => {
        response += `${i + 1}. ${r.title} (${r.category})\n`;
      });
    }

    response += `\n💡 Nếu cần thêm thông tin, vui lòng liên hệ HR: hr@company.com`;

    return {
      success: true,
      data: {
        message: response,
        intent: 'KNOWLEDGE_BASE',
        additionalData: { knowledgeBase: knowledgeResults },
      },
    };
  }

  private async fetchRelevantData(message: string, context: ChatContext): Promise<any> {
    const lowerMessage = message.toLowerCase();
    const data: any = {};
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Extract month from message if specified
    const monthMatch = lowerMessage.match(/tháng (\d+)/);
    const month = monthMatch ? parseInt(monthMatch[1]) : currentMonth;

    // Fetch employee info if asking about personal info
    if (lowerMessage.match(/tôi|mình|của tôi|thông tin/)) {
      if (context.employeeId) {
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

        if (employee) {
          data.employee = {
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            position: employee.position,
            department: employee.department.name,
            email: employee.email,
            startDate: employee.startDate.toLocaleDateString('vi-VN'),
          };
        }
      }
    }

    // Fetch leave balance if asking about phép
    if (lowerMessage.match(/phép|nghỉ phép|số ngày phép/)) {
      if (context.employeeId) {
        const balance = await this.prisma.leaveBalance.findFirst({
          where: { employeeId: context.employeeId, year: currentYear },
        });

        if (balance) {
          data.leaveBalance = {
            year: balance.year,
            annualLeave: Number(balance.annualLeave),
            usedAnnual: Number(balance.usedAnnual),
            sickLeave: Number(balance.sickLeave),
            usedSick: Number(balance.usedSick),
          };
        }
      }
    }

    // Fetch attendance if asking about chấm công
    if (lowerMessage.match(/chấm công|đi làm|công|attendance/)) {
      if (context.employeeId) {
        const startDate = new Date(currentYear, month - 1, 1);
        const endDate = new Date(currentYear, month, 0);

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

        data.attendance = {
          month,
          year: currentYear,
          present,
          late,
          earlyLeave,
          totalHours: totalHours.toFixed(1),
        };
      }
    }

    // Fetch salary if asking about lương
    if (lowerMessage.match(/lương|salary|thu nhập|payroll/)) {
      if (context.employeeId) {
        const payroll = await this.prisma.payroll.findFirst({
          where: { month, year: currentYear },
          include: {
            items: {
              where: { employeeId: context.employeeId },
            },
          },
        });

        if (payroll && payroll.items.length > 0) {
          const item = payroll.items[0];
          data.salary = {
            month,
            year: currentYear,
            baseSalary: Number(item.baseSalary),
            allowances: Number(item.allowances),
            bonus: Number(item.bonus),
            overtimePay: Number(item.overtimePay),
            deduction: Number(item.deduction),
            insurance: Number(item.insurance),
            tax: Number(item.tax),
            netSalary: Number(item.netSalary),
            status: payroll.status,
          };
        }
      }
    }

    // Fetch overtime if asking about tăng ca
    if (lowerMessage.match(/tăng ca|overtime|làm thêm/)) {
      if (context.employeeId) {
        const startDate = new Date(currentYear, month - 1, 1);
        const endDate = new Date(currentYear, month, 0);

        const overtimes = await this.prisma.overtimeRequest.findMany({
          where: {
            employeeId: context.employeeId,
            date: { gte: startDate, lte: endDate },
          },
        });

        const approved = overtimes.filter(o => o.status === 'APPROVED');
        const totalHours = approved.reduce((sum, o) => sum + Number(o.hours), 0);

        data.overtime = {
          month,
          year: currentYear,
          totalHours,
          approved: approved.length,
          pending: overtimes.filter(o => o.status === 'PENDING').length,
        };
      }
    }

    // Fetch leave requests if asking about đơn nghỉ
    if (lowerMessage.match(/đơn nghỉ|đơn phép|leave request/)) {
      if (context.employeeId) {
        const requests = await this.prisma.leaveRequest.findMany({
          where: { employeeId: context.employeeId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        data.leaveRequests = requests.map(req => ({
          leaveType: req.leaveType,
          startDate: req.startDate.toLocaleDateString('vi-VN'),
          endDate: req.endDate.toLocaleDateString('vi-VN'),
          totalDays: Number(req.totalDays),
          status: req.status,
        }));
      }
    }

    // Fetch company statistics for HR_MANAGER and ADMIN
    if (context.role === 'HR_MANAGER' || context.role === 'ADMIN') {
      if (lowerMessage.match(/tổng lương|chi phí lương|company salary/)) {
        const payroll = await this.prisma.payroll.findFirst({
          where: { month, year: currentYear },
          include: {
            _count: { select: { items: true } },
          },
        });

        if (payroll) {
          data.companySalary = {
            month,
            year: currentYear,
            totalAmount: Number(payroll.totalAmount),
            employeeCount: payroll._count.items,
            status: payroll.status,
          };
        }
      }

      if (lowerMessage.match(/số lượng nhân viên|bao nhiêu nhân viên|employee count/)) {
        const total = await this.prisma.employee.count();
        const active = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
        const inactive = await this.prisma.employee.count({ where: { status: 'INACTIVE' } });

        data.employeeStats = { total, active, inactive };
      }

      if (lowerMessage.match(/hợp đồng sắp hết|contract expiring/)) {
        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const contracts = await this.prisma.contract.findMany({
          where: {
            status: 'ACTIVE',
            endDate: { gte: now, lte: thirtyDaysLater },
          },
          include: {
            employee: {
              select: { fullName: true, employeeCode: true },
            },
          },
          take: 10,
        });

        data.expiringContracts = contracts.map(c => ({
          employeeName: c.employee.fullName,
          employeeCode: c.employee.employeeCode,
          endDate: c.endDate?.toLocaleDateString('vi-VN'),
          contractType: c.contractType,
        }));
      }
    }

    return data;
  }

  private async fallbackRuleBasedChat(message: string, context: ChatContext, history: ChatMessage[] = []) {
    // Get permissions based on role
    const permissions = this.getPermissions(context.role || 'EMPLOYEE');

    // Phân tích intent từ message
    const intent = await this.detectIntent(message, context.role);

    // Check access permission
    if (!this.hasAccess(intent.type, permissions)) {
      return {
        success: false,
        data: {
          message: '❌ **Quyền truy cập bị từ chối**\n\n' +
            'Bạn không có quyền truy cập thông tin này.\n\n' +
            `Vai trò của bạn: **${this.getRoleLabel(context.role)}**\n\n` +
            'Gõ "help" để xem các câu hỏi bạn có thể hỏi.',
          intent: 'ACCESS_DENIED',
          additionalData: null,
        },
      };
    }

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

      // HR_MANAGER & ADMIN intents
      case 'COMPANY_SALARY_TOTAL':
        response = await this.handleCompanySalaryTotal(context, intent.params);
        break;

      case 'EMPLOYEE_COUNT':
        response = await this.handleEmployeeCount(context);
        break;

      case 'CONTRACT_EXPIRING':
        response = await this.handleContractExpiring(context);
        break;

      case 'DEPARTMENT_STATS':
        response = await this.handleDepartmentStats(context);
        break;

      case 'ATTENDANCE_REPORT':
        response = await this.handleAttendanceReport(context, intent.params);
        break;

      // ADMIN intents
      case 'SYSTEM_STATUS':
        response = await this.handleSystemStatus(context);
        break;

      case 'USER_ACTIVITY':
        response = await this.handleUserActivity(context);
        break;

      case 'AUDIT_LOGS':
        response = await this.handleAuditLogs(context);
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

  private async detectIntent(message: string, role?: string): Promise<{ type: string; params: any }> {
    const lowerMessage = message.toLowerCase();

    // HR_MANAGER & ADMIN only intents
    if (role === 'HR_MANAGER' || role === 'ADMIN') {
      // Company statistics
      if (lowerMessage.match(/tổng lương công ty|lương toàn công ty|chi phí lương/)) {
        const monthMatch = lowerMessage.match(/tháng (\d+)/);
        return {
          type: 'COMPANY_SALARY_TOTAL',
          params: { month: monthMatch ? parseInt(monthMatch[1]) : null }
        };
      }

      // All employees count
      if (lowerMessage.match(/có bao nhiêu nhân viên|số lượng nhân viên|tổng nhân viên/)) {
        return { type: 'EMPLOYEE_COUNT', params: {} };
      }

      // Contract expiring
      if (lowerMessage.match(/sắp hết hợp đồng|hợp đồng sắp hết|hết hạn hợp đồng/)) {
        return { type: 'CONTRACT_EXPIRING', params: {} };
      }

      // Department statistics
      if (lowerMessage.match(/thống kê phòng ban|báo cáo phòng|department/)) {
        return { type: 'DEPARTMENT_STATS', params: {} };
      }

      // Attendance report
      if (lowerMessage.match(/báo cáo chấm công|thống kê chấm công|attendance report/)) {
        const monthMatch = lowerMessage.match(/tháng (\d+)/);
        return {
          type: 'ATTENDANCE_REPORT',
          params: { month: monthMatch ? parseInt(monthMatch[1]) : null }
        };
      }
    }

    // ADMIN only intents
    if (role === 'ADMIN') {
      // System status
      if (lowerMessage.match(/trạng thái hệ thống|system status|hệ thống/)) {
        return { type: 'SYSTEM_STATUS', params: {} };
      }

      // User activity
      if (lowerMessage.match(/ai đã login|user activity|hoạt động người dùng/)) {
        return { type: 'USER_ACTIVITY', params: {} };
      }

      // Audit logs
      if (lowerMessage.match(/audit log|nhật ký|lịch sử thay đổi/)) {
        return { type: 'AUDIT_LOGS', params: {} };
      }
    }

    // Leave balance queries (All roles - own data)
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
      `Trạng thái: ${payroll.status === 'LOCKED' ? '✅ Đã chốt' : '⏳ Đang xử lý'}`;
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

  // =====================================================
  // ROLE-BASED ACCESS CONTROL
  // =====================================================

  private getPermissions(role: string): Permission[] {
    const permissionMap: Record<string, Permission[]> = {
      EMPLOYEE: [Permission.VIEW_OWN_DATA, Permission.VIEW_PUBLIC_POLICY],
      HR_MANAGER: [
        Permission.VIEW_OWN_DATA,
        Permission.VIEW_PUBLIC_POLICY,
        Permission.VIEW_ALL_DATA,
        Permission.VIEW_STATISTICS,
        Permission.VIEW_HR_POLICY,
      ],
      ADMIN: [
        Permission.VIEW_OWN_DATA,
        Permission.VIEW_PUBLIC_POLICY,
        Permission.VIEW_ALL_DATA,
        Permission.VIEW_STATISTICS,
        Permission.VIEW_HR_POLICY,
        Permission.VIEW_SYSTEM,
        Permission.VIEW_AUDIT,
      ],
    };

    return permissionMap[role] || permissionMap['EMPLOYEE'];
  }

  private hasAccess(intentType: string, permissions: Permission[]): boolean {
    const intentPermissions: Record<string, Permission[]> = {
      // Employee intents (own data)
      LEAVE_BALANCE: [Permission.VIEW_OWN_DATA],
      ATTENDANCE_SUMMARY: [Permission.VIEW_OWN_DATA],
      SALARY_INFO: [Permission.VIEW_OWN_DATA],
      OVERTIME_INFO: [Permission.VIEW_OWN_DATA],
      LEAVE_REQUEST_STATUS: [Permission.VIEW_OWN_DATA],
      EMPLOYEE_INFO: [Permission.VIEW_OWN_DATA],

      // Public intents
      COMPANY_POLICY: [Permission.VIEW_PUBLIC_POLICY],
      GREETING: [Permission.VIEW_PUBLIC_POLICY],
      HELP: [Permission.VIEW_PUBLIC_POLICY],

      // HR Manager intents
      COMPANY_SALARY_TOTAL: [Permission.VIEW_ALL_DATA],
      EMPLOYEE_COUNT: [Permission.VIEW_STATISTICS],
      CONTRACT_EXPIRING: [Permission.VIEW_ALL_DATA],
      DEPARTMENT_STATS: [Permission.VIEW_STATISTICS],
      ATTENDANCE_REPORT: [Permission.VIEW_ALL_DATA],
      DEPARTMENT_INFO: [Permission.VIEW_ALL_DATA],

      // Admin intents
      SYSTEM_STATUS: [Permission.VIEW_SYSTEM],
      USER_ACTIVITY: [Permission.VIEW_SYSTEM],
      AUDIT_LOGS: [Permission.VIEW_AUDIT],
    };

    const required = intentPermissions[intentType] || [];
    if (required.length === 0) return true; // Unknown intent = allow

    return required.every(p => permissions.includes(p));
  }

  private getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
      EMPLOYEE: 'Nhân viên',
      HR_MANAGER: 'Quản lý nhân sự',
      ADMIN: 'Quản trị viên',
    };

    return labels[role || 'EMPLOYEE'] || 'Nhân viên';
  }

  // HR/ADMIN handler methods (simplified for fallback)
  private async handleCompanySalaryTotal(context: ChatContext, params: any): Promise<string> {
    const now = new Date();
    const month = params.month || now.getMonth() + 1;
    const year = now.getFullYear();

    const payroll = await this.prisma.payroll.findFirst({
      where: { month, year },
      include: {
        _count: { select: { items: true } },
      },
    });

    if (!payroll) {
      return `Chưa có thông tin lương tháng ${month}/${year}.`;
    }

    return `💰 **Tổng lương công ty tháng ${month}/${year}:**\n\n` +
      `• Tổng chi phí: **${Number(payroll.totalAmount).toLocaleString('vi-VN')} VNĐ**\n` +
      `• Số nhân viên: **${payroll._count.items}** người\n` +
      `• Trung bình: **${(Number(payroll.totalAmount) / payroll._count.items).toLocaleString('vi-VN')} VNĐ/người**\n` +
      `• Trạng thái: ${payroll.status === 'LOCKED' ? '✅ Đã chốt' : '⏳ Đang xử lý'}`;
  }

  private async handleEmployeeCount(context: ChatContext): Promise<string> {
    const total = await this.prisma.employee.count();
    const active = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
    const inactive = await this.prisma.employee.count({ where: { status: 'INACTIVE' } });

    return `👥 **Thống kê nhân viên:**\n\n` +
      `• Tổng số nhân viên: **${total}** người\n` +
      `• Đang làm việc: **${active}** người\n` +
      `• Đã nghỉ việc: **${inactive}** người\n\n` +
      `📊 Tỷ lệ nhân viên đang làm việc: **${((active / total) * 100).toFixed(1)}%**`;
  }

  private async handleContractExpiring(context: ChatContext): Promise<string> {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const contracts = await this.prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: thirtyDaysLater },
      },
      include: {
        employee: {
          select: { fullName: true, employeeCode: true },
        },
      },
      take: 10,
    });

    if (contracts.length === 0) {
      return '✅ **Không có hợp đồng nào sắp hết hạn trong 30 ngày tới.**';
    }

    let response = `⚠️ **Hợp đồng sắp hết hạn (30 ngày tới):**\n\n`;
    response += `Tổng số: **${contracts.length}** hợp đồng\n\n`;

    contracts.forEach((c, index) => {
      const daysLeft = Math.ceil((c.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      response += `${index + 1}. **${c.employee.fullName}** (${c.employee.employeeCode})\n`;
      response += `   • Loại: ${c.contractType}\n`;
      response += `   • Hết hạn: ${c.endDate?.toLocaleDateString('vi-VN')} (còn ${daysLeft} ngày)\n\n`;
    });

    return response;
  }

  private async handleDepartmentStats(context: ChatContext): Promise<string> {
    const departments = await this.prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: {
        employees: {
          _count: 'desc',
        },
      },
    });

    let response = '🏢 **Thống kê phòng ban:**\n\n';
    const totalEmployees = departments.reduce((sum, d) => sum + d._count.employees, 0);

    departments.forEach((dept, index) => {
      const percentage = totalEmployees > 0 ? ((dept._count.employees / totalEmployees) * 100).toFixed(1) : '0';
      response += `${index + 1}. **${dept.name}** (${dept.code})\n`;
      response += `   • Nhân viên: ${dept._count.employees} người (${percentage}%)\n`;
      if (dept.managerId) {
        response += `   • Trưởng phòng: Có\n`;
      }
      response += `\n`;
    });

    response += `\n📊 **Tổng cộng: ${totalEmployees} nhân viên trong ${departments.length} phòng ban**`;

    return response;
  }

  private async handleAttendanceReport(context: ChatContext, params: any): Promise<string> {
    const now = new Date();
    const month = params.month || now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalRecords = attendances.length;
    const present = attendances.filter(a => a.status === 'PRESENT').length;
    const absent = attendances.filter(a => a.status === 'ABSENT').length;
    const late = attendances.filter(a => a.isLate).length;
    const earlyLeave = attendances.filter(a => a.isEarlyLeave).length;

    const uniqueEmployees = new Set(attendances.map(a => a.employeeId)).size;

    return `📊 **Báo cáo chấm công toàn công ty - Tháng ${month}/${year}:**\n\n` +
      `• Tổng số bản ghi: **${totalRecords}** records\n` +
      `• Số nhân viên: **${uniqueEmployees}** người\n` +
      `• Có mặt: **${present}** lần (${((present / totalRecords) * 100).toFixed(1)}%)\n` +
      `• Vắng mặt: **${absent}** lần (${((absent / totalRecords) * 100).toFixed(1)}%)\n` +
      `• Đi muộn: **${late}** lần\n` +
      `• Về sớm: **${earlyLeave}** lần\n\n` +
      `📈 **Tỷ lệ chuyên cần: ${((present / totalRecords) * 100).toFixed(1)}%**`;
  }

  private async handleSystemStatus(context: ChatContext): Promise<string> {
    return 'Chức năng này đang được xử lý bởi AI. Vui lòng thử lại.';
  }

  private async handleUserActivity(context: ChatContext): Promise<string> {
    return 'Chức năng này đang được xử lý bởi AI. Vui lòng thử lại.';
  }

  private async handleAuditLogs(context: ChatContext): Promise<string> {
    return 'Chức năng này đang được xử lý bởi AI. Vui lòng thử lại.';
  }
}

