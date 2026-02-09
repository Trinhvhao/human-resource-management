export enum TerminationCategory {
    RESIGNATION = 'RESIGNATION',
    MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
    COMPANY_TERMINATION = 'COMPANY_TERMINATION',
    CONTRACT_EXPIRATION = 'CONTRACT_EXPIRATION',
    DISCIPLINARY = 'DISCIPLINARY',
}

export interface TerminationRequest {
    id: string;
    contractId: string;
    requestedBy: string;
    terminationCategory: TerminationCategory;
    noticeDate: string;
    terminationDate: string;
    reason: string;
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
    approverId?: string;
    approvedAt?: string;
    approverComments?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    contract?: {
        id: string;
        contractNumber: string;
        contractType: string;
        employee: {
            id: string;
            employeeCode: string;
            fullName: string;
            email: string;
            position?: string;
            department?: {
                id: string;
                name: string;
            };
        };
    };
    requester?: {
        id: string;
        email: string;
        role: string;
    };
    approver?: {
        id: string;
        email: string;
        role: string;
    };
}

export interface CreateTerminationRequestDto {
    contractId: string;
    requestedBy: string;
    terminationCategory: TerminationCategory;
    noticeDate: string;
    terminationDate: string;
    reason: string;
}

export interface ApproveTerminationDto {
    approverId: string;
    comments?: string;
}

export interface RejectTerminationDto {
    approverId: string;
    reason: string;
}

export const TERMINATION_CATEGORY_LABELS: Record<TerminationCategory, string> = {
    [TerminationCategory.RESIGNATION]: 'Nhân viên xin nghỉ việc',
    [TerminationCategory.MUTUAL_AGREEMENT]: 'Thỏa thuận chấm dứt',
    [TerminationCategory.COMPANY_TERMINATION]: 'Công ty chấm dứt',
    [TerminationCategory.CONTRACT_EXPIRATION]: 'Hết hạn hợp đồng',
    [TerminationCategory.DISCIPLINARY]: 'Kỷ luật',
};
