import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHolidayDto) {
    // Check if holiday exists on this date
    const existing = await this.prisma.holiday.findUnique({
      where: { date: new Date(dto.date) },
    });

    if (existing) {
      throw new ConflictException('Holiday already exists on this date');
    }

    const holiday = await this.prisma.holiday.create({
      data: {
        name: dto.name,
        date: new Date(dto.date),
        year: dto.year,
        isRecurring: dto.isRecurring || false,
      },
    });

    return {
      success: true,
      message: 'Holiday created successfully',
      data: holiday,
    };
  }

  async findAll(year?: number) {
    const where: any = {};
    if (year) where.year = year;

    const holidays = await this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return {
      success: true,
      data: holidays,
      meta: { total: holidays.length, year: year || 'all' },
    };
  }

  async findByYear(year: number) {
    const holidays = await this.prisma.holiday.findMany({
      where: { year },
      orderBy: { date: 'asc' },
    });

    return {
      success: true,
      data: holidays,
      meta: { total: holidays.length, year },
    };
  }

  async delete(id: string) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    await this.prisma.holiday.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Holiday deleted successfully',
    };
  }

  async initYearHolidays(year: number) {
    // Vietnamese holidays
    const holidays = [
      { name: 'Tết Dương lịch', date: `${year}-01-01`, isRecurring: true },
      { name: 'Giải phóng miền Nam', date: `${year}-04-30`, isRecurring: true },
      { name: 'Quốc tế Lao động', date: `${year}-05-01`, isRecurring: true },
      { name: 'Quốc khánh', date: `${year}-09-02`, isRecurring: true },
    ];

    let created = 0;
    let skipped = 0;

    for (const holiday of holidays) {
      try {
        await this.prisma.holiday.create({
          data: {
            name: holiday.name,
            date: new Date(holiday.date),
            year,
            isRecurring: holiday.isRecurring,
          },
        });
        created++;
      } catch (error) {
        skipped++;
      }
    }

    return {
      success: true,
      message: `Initialized holidays for ${year}`,
      data: { created, skipped, total: holidays.length },
    };
  }

  // Helper method: Check if a date is holiday
  async isHoliday(date: Date): Promise<boolean> {
    const holiday = await this.prisma.holiday.findUnique({
      where: { date },
    });
    return !!holiday;
  }

  // Helper method: Get work days in month (excluding weekends and holidays)
  async getWorkDaysInMonth(month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const holidays = await this.prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const holidayDates = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));

    let workDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split('T')[0];

      // Not weekend and not holiday
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        workDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return workDays;
  }
}
