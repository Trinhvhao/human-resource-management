import { IsOptional, IsString, IsInt, IsDateString, Min, Max } from 'class-validator';

export class UpdateEmployeeProfileDto {
  // Personal Information
  @IsOptional()
  @IsString()
  placeOfBirth?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  ethnicity?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string; // SINGLE, MARRIED, DIVORCED, WIDOWED

  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfChildren?: number;

  // Address Details
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  temporaryAddress?: string;

  // Government IDs
  @IsOptional()
  @IsString()
  socialInsuranceNumber?: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsDateString()
  passportExpiry?: string;

  // Emergency Contact
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactAddress?: string;

  // Education
  @IsOptional()
  @IsString()
  highestEducation?: string; // HIGH_SCHOOL, ASSOCIATE, BACHELOR, MASTER, PHD

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  graduationYear?: number;

  @IsOptional()
  @IsString()
  professionalCertificates?: string; // JSON string

  // Bank Information
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankBranch?: string;

  // Work Experience
  @IsOptional()
  workExperience?: any; // JSON object
}
