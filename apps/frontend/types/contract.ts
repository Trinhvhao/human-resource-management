export type ContractType = 'PROBATION' | 'FIXED_TERM' | 'INDEFINITE';
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface Contract {
  id: string;
  employeeId: string;
  contractNumber: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  salary: number;
  status: ContractStatus;
  fileUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
}

export interface CreateContractData {
  employeeId: string;
  contractNumber: string;
  contractType: ContractType;
  startDate: string;
  endDate?: string;
  salary: number;
  notes?: string;
}

export interface UpdateContractData extends Partial<CreateContractData> {
  status?: ContractStatus;
}

export interface ExpiringContract {
  contract: Contract;
  daysUntilExpiry: number;
}
