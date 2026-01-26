import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Holidays')
@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all holidays', description: 'Get holidays, optionally filter by year' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiResponse({ status: 200, description: 'Holidays retrieved successfully' })
  findAll(@Query('year') year?: number) {
    return this.holidaysService.findAll(year);
  }

  @Get('year/:year')
  @Public()
  @ApiOperation({ summary: 'Get holidays by year' })
  @ApiParam({ name: 'year', description: 'Year', example: 2026 })
  @ApiResponse({ status: 200, description: 'Holidays retrieved' })
  findByYear(@Param('year') year: number) {
    return this.holidaysService.findByYear(+year);
  }

  @Get('work-days/:month/:year')
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get work days in month', description: 'Calculate work days excluding weekends and holidays' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  @ApiParam({ name: 'year', description: 'Year' })
  async getWorkDays(@Param('month') month: number, @Param('year') year: number) {
    const workDays = await this.holidaysService.getWorkDaysInMonth(+month, +year);
    return {
      success: true,
      data: { month: +month, year: +year, workDays },
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create holiday' })
  @ApiResponse({ status: 201, description: 'Holiday created' })
  @ApiResponse({ status: 409, description: 'Holiday already exists' })
  create(@Body() createHolidayDto: CreateHolidayDto) {
    return this.holidaysService.create(createHolidayDto);
  }

  @Post('init-year/:year')
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Initialize holidays for year', description: 'Auto-create Vietnamese holidays' })
  @ApiParam({ name: 'year', description: 'Year', example: 2026 })
  @ApiResponse({ status: 201, description: 'Holidays initialized' })
  initYear(@Param('year') year: number) {
    return this.holidaysService.initYearHolidays(+year);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Delete holiday' })
  @ApiParam({ name: 'id', description: 'Holiday UUID' })
  @ApiResponse({ status: 200, description: 'Holiday deleted' })
  delete(@Param('id') id: string) {
    return this.holidaysService.delete(id);
  }
}
