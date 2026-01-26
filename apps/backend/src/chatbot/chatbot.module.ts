import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeesModule } from '../employees/employees.module';
import { DepartmentsModule } from '../departments/departments.module';
import { AttendancesModule } from '../attendances/attendances.module';
import { LeaveRequestsModule } from '../leave-requests/leave-requests.module';
import { PayrollsModule } from '../payrolls/payrolls.module';

@Module({
  imports: [
    PrismaModule,
    EmployeesModule,
    DepartmentsModule,
    AttendancesModule,
    LeaveRequestsModule,
    PayrollsModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
