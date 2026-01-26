import { Module } from '@nestjs/common';
import { PayrollsController } from './payrolls.controller';
import { PayrollsService } from './payrolls.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { OvertimeModule } from '../overtime/overtime.module';
import { SalaryComponentsModule } from '../salary-components/salary-components.module';

@Module({
  imports: [PrismaModule, HolidaysModule, OvertimeModule, SalaryComponentsModule],
  controllers: [PayrollsController],
  providers: [PayrollsService],
  exports: [PayrollsService],
})
export class PayrollsModule {}
