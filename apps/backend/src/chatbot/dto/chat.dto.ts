import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ChatMessage {
  @ApiProperty({ example: 'user', enum: ['user', 'assistant', 'system'] })
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ example: 'Tôi còn bao nhiêu ngày phép?' })
  @IsString()
  content: string;
}

export class ChatDto {
  @ApiProperty({ 
    example: 'Tôi còn bao nhiêu ngày phép?',
    description: 'Tin nhắn từ người dùng'
  })
  @IsString()
  message: string;

  @ApiProperty({ 
    type: [ChatMessage],
    required: false,
    description: 'Lịch sử chat (optional)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessage)
  history?: ChatMessage[];
}
