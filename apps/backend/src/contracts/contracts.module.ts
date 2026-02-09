import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractValidationService } from './contract-validation.service';
import { ContractHistoryService } from './contract-history.service';
import { TerminationRequestService } from './termination-request.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractValidationService,
    ContractHistoryService,
    TerminationRequestService,
  ],
  exports: [
    ContractsService,
    ContractValidationService,
    ContractHistoryService,
    TerminationRequestService,
  ],
})
export class ContractsModule { }
