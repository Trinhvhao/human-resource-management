import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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

    const token = this.generateToken(user);

    return {
      success: true,
      message: 'User registered successfully',
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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      success: true,
      message: 'Login successful',
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
}
