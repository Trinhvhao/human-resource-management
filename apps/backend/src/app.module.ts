import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { ContractsModule } from './contracts/contracts.module';
import { AttendancesModule } from './attendances/attendances.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { PayrollsModule } from './payrolls/payrolls.module';
import { RewardsModule } from './rewards/rewards.module';
import { DisciplinesModule } from './disciplines/disciplines.module';
import { HolidaysModule } from './holidays/holidays.module';
import { LeaveBalancesModule } from './leave-balances/leave-balances.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AttendanceCorrectionsModule } from './attendance-corrections/attendance-corrections.module';
import { OvertimeModule } from './overtime/overtime.module';
import { MailModule } from './mail/mail.module';
import { ExportModule } from './export/export.module';
import { UploadModule } from './upload/upload.module';
import { SalaryComponentsModule } from './salary-components/salary-components.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { TeamsModule } from './teams/teams.module';
import { CalendarModule } from './calendar/calendar.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FaceRecognitionModule } from './face-recognition/face-recognition.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    ExportModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    EmployeesModule,
    ContractsModule,
    AttendancesModule,
    LeaveRequestsModule,
    PayrollsModule,
    RewardsModule,
    DisciplinesModule,
    HolidaysModule,
    LeaveBalancesModule,
    DashboardModule,
    AttendanceCorrectionsModule,
    OvertimeModule,
    UploadModule,
    SalaryComponentsModule,
    ChatbotModule,
    TeamsModule,
    CalendarModule,
    NotificationsModule,
    FaceRecognitionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
