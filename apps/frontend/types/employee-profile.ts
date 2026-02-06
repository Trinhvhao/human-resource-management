export interface EmployeeProfile {
  id: string;
  employeeId: string;
  placeOfBirth?: string;
  nationality?: string;
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  numberOfChildren?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  emergencyContactAddress?: string;
  highestEducation?: 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE';
  major?: string;
  university?: string;
  graduationYear?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
  taxCode?: string;
  socialInsuranceNumber?: string;
  healthInsuranceNumber?: string;
  profileCompletionPercentage: number;
  lastProfileUpdate?: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedAt: string;
  uploader?: {
    id: string;
    email: string;
  };
}

export enum DocumentType {
  AVATAR = 'AVATAR',
  RESUME = 'RESUME',
  ID_CARD_FRONT = 'ID_CARD_FRONT',
  ID_CARD_BACK = 'ID_CARD_BACK',
  DEGREE = 'DEGREE',
  CERTIFICATE = 'CERTIFICATE',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.AVATAR]: 'Ảnh đại diện',
  [DocumentType.RESUME]: 'Hồ sơ/CV',
  [DocumentType.ID_CARD_FRONT]: 'CMND/CCCD mặt trước',
  [DocumentType.ID_CARD_BACK]: 'CMND/CCCD mặt sau',
  [DocumentType.DEGREE]: 'Bằng cấp',
  [DocumentType.CERTIFICATE]: 'Chứng chỉ',
  [DocumentType.CONTRACT]: 'Hợp đồng',
  [DocumentType.OTHER]: 'Khác',
};

export const MARITAL_STATUS_LABELS = {
  SINGLE: 'Độc thân',
  MARRIED: 'Đã kết hôn',
  DIVORCED: 'Ly hôn',
  WIDOWED: 'Góa',
};

export const EDUCATION_LABELS = {
  HIGH_SCHOOL: 'Trung học phổ thông',
  ASSOCIATE: 'Cao đẳng',
  BACHELOR: 'Đại học',
  MASTER: 'Thạc sĩ',
  DOCTORATE: 'Tiến sĩ',
};

export const RELATIONSHIP_OPTIONS = [
  'Vợ/Chồng',
  'Cha/Mẹ',
  'Con',
  'Anh/Chị/Em',
  'Khác',
];

export const VIETNAM_BANKS = [
  'Vietcombank',
  'VietinBank',
  'BIDV',
  'Agribank',
  'Techcombank',
  'MB Bank',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'HDBank',
  'VIB',
  'SHB',
  'SeABank',
  'OCB',
  'MSB',
  'Eximbank',
  'LienVietPostBank',
  'BacABank',
  'VietCapitalBank',
  'Khác',
];
