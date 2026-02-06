import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Storage Service - Supports both Supabase Storage and Local Storage
 * Automatically uses Supabase if credentials are configured, otherwise falls back to local
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private supabase: SupabaseClient;
  private useSupabase: boolean;
  private readonly bucket = 'hrms-files'; // Supabase bucket name

  constructor(private configService: ConfigService) {
    // Initialize local storage
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }

    // Check if Supabase is configured
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    this.useSupabase = !!(
      supabaseUrl && 
      supabaseKey && 
      supabaseKey !== 'your-service-role-key' &&
      supabaseUrl !== 'https://your-project.supabase.co'
    );
    
    if (this.useSupabase && supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.logger.log('✅ Supabase Storage initialized');
    } else {
      this.logger.log('📁 Using local file storage (Supabase not configured)');
    }
  }

  /**
   * Upload file to storage (Supabase or local)
   * @param file - File buffer
   * @param fileName - File name
   * @param folder - Subfolder (e.g., 'avatars', 'documents')
   * @returns File URL
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    folder: string = 'documents',
  ): Promise<string> {
    if (this.useSupabase) {
      return this.uploadToSupabase(file, fileName, folder);
    } else {
      return this.uploadToLocal(file, fileName, folder);
    }
  }

  /**
   * Upload to Supabase Storage
   */
  private async uploadToSupabase(
    file: Buffer,
    fileName: string,
    folder: string,
  ): Promise<string> {
    try {
      const filePath = `${folder}/${fileName}`;
      
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(filePath, file, {
          contentType: this.getMimeType(fileName),
          upsert: true, // Allow overwrite
        });

      if (error) {
        this.logger.error(`Supabase upload failed: ${error.message}`);
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(filePath);

      this.logger.log(`File uploaded to Supabase: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload to Supabase: ${error.message}`);
      // Fallback to local storage
      this.logger.warn('Falling back to local storage');
      return this.uploadToLocal(file, fileName, folder);
    }
  }

  /**
   * Upload to local storage
   */
  private async uploadToLocal(
    file: Buffer,
    fileName: string,
    folder: string,
  ): Promise<string> {
    try {
      // Create folder if not exists
      const folderPath = path.join(this.uploadDir, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Save file
      const filePath = path.join(folderPath, fileName);
      fs.writeFileSync(filePath, file);

      // Return relative URL
      const fileUrl = `/uploads/${folder}/${fileName}`;
      this.logger.log(`File uploaded locally: ${fileUrl}`);
      
      return fileUrl;
    } catch (error) {
      this.logger.error(`Failed to upload locally: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete file from storage
   * @param fileUrl - File URL to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (this.useSupabase && fileUrl.includes('supabase.co')) {
      await this.deleteFromSupabase(fileUrl);
    } else {
      await this.deleteFromLocal(fileUrl);
    }
  }

  /**
   * Delete from Supabase Storage
   */
  private async deleteFromSupabase(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path/file.jpg
      const urlParts = fileUrl.split(`/storage/v1/object/public/${this.bucket}/`);
      if (urlParts.length < 2) {
        this.logger.warn(`Invalid Supabase URL format: ${fileUrl}`);
        return;
      }
      
      const filePath = urlParts[1];
      
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        this.logger.error(`Supabase delete failed: ${error.message}`);
      } else {
        this.logger.log(`File deleted from Supabase: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete from Supabase: ${error.message}`);
    }
  }

  /**
   * Delete from local storage
   */
  private async deleteFromLocal(fileUrl: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), fileUrl);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted locally: ${fileUrl}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete locally: ${error.message}`);
    }
  }

  /**
   * Get file path from URL (for local storage)
   * @param fileUrl - File URL
   * @returns Absolute file path
   */
  getFilePath(fileUrl: string): string {
    return path.join(process.cwd(), fileUrl);
  }

  /**
   * Check if file exists (for local storage)
   * @param fileUrl - File URL
   * @returns True if file exists
   */
  fileExists(fileUrl: string): boolean {
    if (this.useSupabase && fileUrl.includes('supabase.co')) {
      // For Supabase, assume file exists if URL is valid
      return true;
    }
    const filePath = this.getFilePath(fileUrl);
    return fs.existsSync(filePath);
  }

  /**
   * Get storage type
   */
  getStorageType(): 'supabase' | 'local' {
    return this.useSupabase ? 'supabase' : 'local';
  }

  /**
   * Get MIME type from file name
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
