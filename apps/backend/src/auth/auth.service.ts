import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
  ) { }

  async register(dto: RegisterDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if employeeId exists and not linked
    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        include: { user: true },
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      if (employee.user) {
        throw new ConflictException('Employee already has an account');
      }
    }

    // Hash password
    const passwordHash = await this.hashPassword(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        employeeId: dto.employeeId,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    // Send verification email (don't wait for it)
    this.sendVerificationEmail(user.id).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    const token = this.generateToken(user);

    return {
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: this.sanitizeUser(user),
        accessToken: token,
      },
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại trong hệ thống');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }

    const token = this.generateToken(user);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: this.sanitizeUser(user),
        accessToken: token,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await this.comparePassword(dto.oldPassword, user.passwordHash);

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(dto.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await this.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  // =====================================================
  // EMAIL VERIFICATION METHODS
  // =====================================================

  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    // Generate verification token (JWT with 24h expiration)
    const verificationToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'email-verification' },
      { expiresIn: '24h' }
    );

    // Save token to database
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken: verificationToken },
    });

    // Send verification email
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Xác thực Email - HRMS Pro',
      template: 'email-verification',
      context: {
        email: user.email,
        verificationUrl,
      },
    });

    return {
      success: true,
      message: 'Email xác thực đã được gửi',
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    try {
      // Verify JWT token
      const payload = this.jwtService.verify(dto.token);

      if (payload.type !== 'email-verification') {
        throw new BadRequestException('Token không hợp lệ');
      }

      // Find user with this token
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          emailVerificationToken: dto.token,
        },
      });

      if (!user) {
        throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
      }

      if (user.isEmailVerified) {
        throw new BadRequestException('Email đã được xác thực trước đó');
      }

      // Update user
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null, // Clear token after verification
        },
      });

      // Send success email
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const loginUrl = `${frontendUrl}/login`;

      await this.mailService.sendMail({
        to: user.email,
        subject: 'Email đã được xác thực - HRMS Pro',
        template: 'email-verified-success',
        context: {
          email: user.email,
          loginUrl,
        },
      });

      return {
        success: true,
        message: 'Email đã được xác thực thành công',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token không hợp lệ');
      }
      throw error;
    }
  }

  async resendVerificationEmail(dto: ResendVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Email không tồn tại trong hệ thống');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    // Send verification email
    await this.sendVerificationEmail(user.id);

    return {
      success: true,
      message: 'Email xác thực đã được gửi lại',
    };
  }
}
