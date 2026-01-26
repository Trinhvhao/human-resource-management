import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private bucketName = 'hrm-files';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Upload avatar nhân viên
   */
  async uploadAvatar(employeeId: string, file: Express.Multer.File): Promise<string> {
    this.validateImageFile(file);

    const fileExt = file.originalname.split('.').pop();
    const fileName = `avatars/${employeeId}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Upload contract document
   */
  async uploadContract(contractId: string, file: Express.Multer.File): Promise<string> {
    this.validatePdfFile(file);

    const fileExt = file.originalname.split('.').pop();
    const fileName = `contracts/${contractId}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Upload general document (certificate, degree, etc.)
   */
  async uploadDocument(
    employeeId: string,
    category: string,
    file: Express.Multer.File,
  ): Promise<string> {
    this.validateDocumentFile(file);

    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    const fileName = `documents/${employeeId}/${category}/${timestamp}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    // Extract path from full URL
    const path = filePath.split(`${this.bucketName}/`)[1];
    
    if (!path) {
      throw new BadRequestException('Invalid file path');
    }

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  /**
   * List files for an employee
   */
  async listEmployeeFiles(employeeId: string, category?: string): Promise<any[]> {
    const path = category 
      ? `documents/${employeeId}/${category}`
      : `documents/${employeeId}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(path);

    if (error) {
      throw new BadRequestException(`List failed: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 5MB');
    }
  }

  /**
   * Validate PDF file
   */
  private validatePdfFile(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 10MB');
    }
  }

  /**
   * Validate document file
   */
  private validateDocumentFile(file: Express.Multer.File): void {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 10MB');
    }
  }
}
