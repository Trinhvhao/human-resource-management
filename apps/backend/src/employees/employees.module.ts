import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeeActivityService } from './employee-activity.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

// Ensure upload directories exist
const uploadDirs = ['./uploads', './uploads/avatars', './uploads/documents'];
uploadDirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}`);
        },
      }),
    }),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeeActivityService],
  exports: [EmployeesService, EmployeeActivityService],
})
export class EmployeesModule {}
