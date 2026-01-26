import { IsString, IsDateString, IsInt, Min, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ example: 'Tết Nguyên Đán', description: 'Holiday name' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2026-02-17', description: 'Holiday date' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({ example: false, required: false, description: 'Is recurring every year' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
