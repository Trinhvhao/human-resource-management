import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractValidationService } from './contract-validation.service';
import { MailService } from '../mail/mail.service';
import {
    CreateTerminationRequestDto,
    TerminationCategory,
} from './dto/create-termination-request.dto';
import { ApproveTerminationDto } from './dto/approve-termination.dto';
import { RejectTerminationDto } from './dto/reject-termination.dto';

@Injectable()
export class TerminationRequestService {
    constructor(
        private prisma: PrismaService,
        private validationService: ContractValidationService,
        private mailService: MailService,
    ) { }

    /**
     * Create a new termination request
     * Property 11: Termination Workflow Creation
     */
    async createTerminationRequest(
        dto: CreateTerminationRequestDto,
    ): Promise<any> {
        // Validate contract exists and is active
        const contract = await this.prisma.contract.findUnique({
            where: { id: dto.contractId },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        if (!contract) {
            throw new NotFoundException('Contract not found');
        }

        if (contract.status !== 'ACTIVE') {
            throw new BadRequestException('Contract is not active');
        }

        // Check for existing pending termination request
        const existingRequest = await this.prisma.terminationRequest.findFirst({
            where: {
                contractId: dto.contractId,
                status: 'PENDING_APPROVAL',
            },
        });

        if (existingRequest) {
            throw new BadRequestException(
                'A pending termination request already exists for this contract',
            );
        }

        // Validate termination notice period
        const validation = this.validationService.validateTerminationNotice(
            {
                contractType: contract.contractType,
                startDate: contract.startDate,
                endDate: contract.endDate,
            },
            dto.noticeDate,
            dto.terminationDate,
        );

        if (!validation.isValid) {
            throw new BadRequestException({
                message: validation.errorMessage,
                code: validation.errorCode,
                details: validation.details,
            });
        }

        // Create termination request
        const terminationRequest = await this.prisma.terminationRequest.create({
            data: {
                contractId: dto.contractId,
                requestedBy: dto.requestedBy,
                terminationCategory: dto.terminationCategory,
                noticeDate: dto.noticeDate,
                terminationDate: dto.terminationDate,
                reason: dto.reason,
                status: 'PENDING_APPROVAL',
            },
            include: {
                contract: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                employeeCode: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
                requester: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // TODO: Send notification email to approvers
        // await this.mailService.sendTerminationRequestNotification(terminationRequest);

        return {
            success: true,
            message: 'Termination request created successfully',
            data: terminationRequest,
        };
    }

    /**
     * Approve a termination request
     * Property 12: Termination Approval Workflow
     */
    async approveTermination(
        requestId: string,
        dto: ApproveTerminationDto,
    ): Promise<any> {
        const request = await this.prisma.terminationRequest.findUnique({
            where: { id: requestId },
            include: {
                contract: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                employeeCode: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
                requester: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!request) {
            throw new NotFoundException('Termination request not found');
        }

        if (request.status !== 'PENDING_APPROVAL') {
            throw new BadRequestException(
                'Termination request is not pending approval',
            );
        }

        // Update termination request status
        const updatedRequest = await this.prisma.terminationRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                approverId: dto.approverId,
                approvedAt: new Date(),
                approverComments: dto.comments,
            },
        });

        // Update contract status to TERMINATED
        await this.prisma.contract.update({
            where: { id: request.contractId },
            data: {
                status: 'TERMINATED',
                endDate: request.terminationDate,
                terminatedReason: request.reason,
            },
        });

        // Update employee status to INACTIVE and set end date
        await this.prisma.employee.update({
            where: { id: request.contract.employeeId },
            data: {
                status: 'INACTIVE',
                endDate: request.terminationDate,
            },
        });

        // TODO: Send approval notification email
        // await this.mailService.sendTerminationApprovedNotification(request);

        return {
            success: true,
            message: 'Termination request approved successfully',
            data: updatedRequest,
        };
    }

    /**
     * Reject a termination request
     * Property 13: Termination Rejection Workflow
     */
    async rejectTermination(
        requestId: string,
        dto: RejectTerminationDto,
    ): Promise<any> {
        const request = await this.prisma.terminationRequest.findUnique({
            where: { id: requestId },
            include: {
                contract: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                employeeCode: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
                requester: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!request) {
            throw new NotFoundException('Termination request not found');
        }

        if (request.status !== 'PENDING_APPROVAL') {
            throw new BadRequestException(
                'Termination request is not pending approval',
            );
        }

        // Update termination request status
        const updatedRequest = await this.prisma.terminationRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                approverId: dto.approverId,
                approvedAt: new Date(),
                rejectionReason: dto.reason,
            },
        });

        // Contract remains ACTIVE - no changes needed

        // TODO: Send rejection notification email
        // await this.mailService.sendTerminationRejectedNotification(request);

        return {
            success: true,
            message: 'Termination request rejected successfully',
            data: updatedRequest,
        };
    }

    /**
     * Get pending termination requests for an approver
     */
    async getPendingTerminations(approverId?: string): Promise<any> {
        const requests = await this.prisma.terminationRequest.findMany({
            where: {
                status: 'PENDING_APPROVAL',
            },
            include: {
                contract: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                employeeCode: true,
                                fullName: true,
                                email: true,
                                position: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                requester: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return {
            success: true,
            data: requests,
            meta: {
                total: requests.length,
            },
        };
    }

    /**
     * Get a specific termination request
     * Property 14: Pending Termination Visibility
     */
    async getTerminationRequest(requestId: string): Promise<any> {
        const request = await this.prisma.terminationRequest.findUnique({
            where: { id: requestId },
            include: {
                contract: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                employeeCode: true,
                                fullName: true,
                                email: true,
                                position: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
                requester: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!request) {
            throw new NotFoundException('Termination request not found');
        }

        return {
            success: true,
            data: request,
        };
    }

    /**
     * Get termination requests by contract
     */
    async getTerminationRequestsByContract(contractId: string): Promise<any> {
        const requests = await this.prisma.terminationRequest.findMany({
            where: { contractId },
            include: {
                requester: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
                approver: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            success: true,
            data: requests,
            meta: {
                total: requests.length,
            },
        };
    }

    /**
     * Get termination category label in Vietnamese
     */
    getTerminationCategoryLabel(category: TerminationCategory): string {
        switch (category) {
            case TerminationCategory.RESIGNATION:
                return 'Nhân viên xin nghỉ việc';
            case TerminationCategory.MUTUAL_AGREEMENT:
                return 'Thỏa thuận chấm dứt';
            case TerminationCategory.COMPANY_TERMINATION:
                return 'Công ty chấm dứt';
            case TerminationCategory.CONTRACT_EXPIRATION:
                return 'Hết hạn hợp đồng';
            case TerminationCategory.DISCIPLINARY:
                return 'Kỷ luật';
            default:
                return 'Không xác định';
        }
    }
}
