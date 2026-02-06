import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { DepartmentChangeRequestsService } from './department-change-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentChangeRequestsService],
  exports: [DepartmentsService, DepartmentChangeRequestsService],
})
export class DepartmentsModule {}
