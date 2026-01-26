export type DisciplineType = 'WARNING' | 'SUSPENSION' | 'FINE' | 'TERMINATION' | 'OTHER';

export interface Discipline {
  id: string;
  employeeId: string;
  type: DisciplineType;
  title: string;
  description?: string;
  amount?: number;
  disciplineDate: string;
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

export interface CreateDisciplineData {
  employeeId: string;
  type: DisciplineType;
  title: string;
  description?: string;
  amount?: number;
  disciplineDate: string;
}

export interface UpdateDisciplineData extends Partial<CreateDisciplineData> {}
