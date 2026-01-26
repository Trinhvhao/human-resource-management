import { Module } from '@nestjs/common';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequestsService } from './leave-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaveBalancesModule } from '../leave-balances/leave-balances.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, LeaveBalancesModule, HolidaysModule, MailModule],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
