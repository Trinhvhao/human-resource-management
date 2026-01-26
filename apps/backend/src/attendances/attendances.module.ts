import { Module } from '@nestjs/common';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HolidaysModule } from '../holidays/holidays.module';

@Module({
  imports: [PrismaModule, HolidaysModule],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
