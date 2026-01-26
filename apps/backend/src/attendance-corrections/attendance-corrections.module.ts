import { Module } from '@nestjs/common';
import { AttendanceCorrectionsController } from './attendance-corrections.controller';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [AttendanceCorrectionsController],
  providers: [AttendanceCorrectionsService],
  exports: [AttendanceCorrectionsService],
})
export class AttendanceCorrectionsModule {}
