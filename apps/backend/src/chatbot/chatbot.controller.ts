import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatDto } from './dto/chat.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ 
    summary: 'Chat với AI assistant',
    description: 'Gửi tin nhắn và nhận phản hồi từ AI chatbot nội bộ công ty'
  })
  @ApiResponse({ status: 200, description: 'Phản hồi thành công' })
  async chat(@Body() dto: ChatDto, @Request() req) {
    const context = {
      employeeId: req.user.employeeId,
      role: req.user.role,
    };

    const response = await this.chatbotService.chat(
      dto.message,
      context,
      dto.history || [],
    );

    // Save chat history
    if (context.employeeId) {
      await this.chatbotService.saveChatHistory(
        context.employeeId,
        dto.message,
        response.data.message,
      );
    }

    return response;
  }

  @Get('history')
  @ApiOperation({ 
    summary: 'Lấy lịch sử chat',
    description: 'Lấy lịch sử chat của nhân viên'
  })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử thành công' })
  async getHistory(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    const history = await this.chatbotService.getChatHistory(
      req.user.employeeId,
      limit ? parseInt(limit.toString()) : 10,
    );

    return {
      success: true,
      data: history,
      meta: { total: history.length },
    };
  }

  @Get('suggestions')
  @ApiOperation({ 
    summary: 'Lấy gợi ý câu hỏi',
    description: 'Lấy danh sách câu hỏi gợi ý cho người dùng'
  })
  @ApiResponse({ status: 200, description: 'Lấy gợi ý thành công' })
  getSuggestions() {
    return {
      success: true,
      data: [
        {
          category: 'Phép năm',
          questions: [
            'Tôi còn bao nhiêu ngày phép?',
            'Số dư phép năm của tôi?',
            'Phép bệnh còn bao nhiêu?',
          ],
        },
        {
          category: 'Chấm công',
          questions: [
            'Chấm công tháng này của tôi thế nào?',
            'Tôi đi muộn bao nhiêu lần tháng này?',
            'Tổng giờ làm việc tháng này?',
          ],
        },
        {
          category: 'Lương',
          questions: [
            'Lương tháng này của tôi bao nhiêu?',
            'Lương tháng 12 của tôi?',
            'Thông tin lương chi tiết?',
          ],
        },
        {
          category: 'Tăng ca',
          questions: [
            'Tôi đã tăng ca bao nhiêu giờ?',
            'Còn được tăng ca bao nhiêu giờ?',
            'Quy định về tăng ca?',
          ],
        },
        {
          category: 'Chính sách',
          questions: [
            'Quy định về giờ làm việc?',
            'Chính sách nghỉ phép?',
            'Chính sách tăng ca?',
            'Chính sách lương?',
          ],
        },
        {
          category: 'Đơn từ',
          questions: [
            'Trạng thái đơn nghỉ phép của tôi?',
            'Đơn tăng ca của tôi?',
            'Các đơn đang chờ duyệt?',
          ],
        },
      ],
    };
  }
}
