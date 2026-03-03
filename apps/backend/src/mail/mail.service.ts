import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isEnabled: boolean;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get('MAIL_ENABLED', 'false') === 'true';
    if (!this.isEnabled) {
      this.logger.warn('📧 Email service is DISABLED. Set MAIL_ENABLED=true to enable.');
    } else {
      this.logger.log('📧 Email service is ENABLED');
    }
  }

  /**
   * Send email for leave request approval
   */
  async sendLeaveApproved(to: string, data: {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    approverName: string;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send leave approved email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '✅ Đơn nghỉ phép đã được duyệt',
        template: './leave-approved',
        context: data,
      });
      this.logger.log(`✅ Sent leave approved email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send leave approved email to ${to}:`, error.message);
    }
  }

  /**
   * Send email for leave request rejection
   */
  async sendLeaveRejected(to: string, data: {
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    approverName: string;
    reason: string;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send leave rejected email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '❌ Đơn nghỉ phép bị từ chối',
        template: './leave-rejected',
        context: data,
      });
      this.logger.log(`✅ Sent leave rejected email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send leave rejected email to ${to}:`, error.message);
    }
  }

  /**
   * Send email for overtime approval
   */
  async sendOvertimeApproved(to: string, data: {
    employeeName: string;
    date: string;
    hours: number;
    approverName: string;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send overtime approved email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '✅ Đơn tăng ca đã được duyệt',
        template: './overtime-approved',
        context: data,
      });
      this.logger.log(`✅ Sent overtime approved email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send overtime approved email to ${to}:`, error.message);
    }
  }

  /**
   * Send email for overtime rejection
   */
  async sendOvertimeRejected(to: string, data: {
    employeeName: string;
    date: string;
    hours: number;
    approverName: string;
    reason: string;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send overtime rejected email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '❌ Đơn tăng ca bị từ chối',
        template: './overtime-rejected',
        context: data,
      });
      this.logger.log(`✅ Sent overtime rejected email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send overtime rejected email to ${to}:`, error.message);
    }
  }

  /**
   * Send email for contract expiration alert
   */
  async sendContractExpiringAlert(to: string, data: {
    employeeName: string;
    contractType: string;
    endDate: string;
    daysRemaining: number;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send contract expiring alert to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '⚠️ Cảnh báo: Hợp đồng sắp hết hạn',
        template: './contract-expiring',
        context: data,
      });
      this.logger.log(`✅ Sent contract expiring alert to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send contract expiring alert to ${to}:`, error.message);
    }
  }

  /**
   * Send payslip email
   */
  async sendPayslip(to: string, data: {
    employeeName: string;
    month: number;
    year: number;
    netSalary: number;
    baseSalary: number;
    allowances: number;
    bonus: number;
    deduction: number;
    overtimePay: number;
    insurance: number;
    tax: number;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send payslip email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: `💰 Phiếu lương tháng ${data.month}/${data.year}`,
        template: './payslip',
        context: data,
      });
      this.logger.log(`✅ Sent payslip email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send payslip email to ${to}:`, error.message);
    }
  }

  /**
   * Send welcome email to new employee
   */
  async sendWelcomeEmail(to: string, data: {
    employeeName: string;
    employeeCode: string;
    position: string;
    department: string;
    startDate: string;
    email: string;
    temporaryPassword?: string;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send welcome email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '🎉 Chào mừng bạn đến với công ty!',
        template: './welcome',
        context: data,
      });
      this.logger.log(`✅ Sent welcome email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email to ${to}:`, error.message);
    }
  }

  /**
   * Send attendance correction approval
   */
  async sendAttendanceCorrectionApproved(to: string, data: {
    employeeName: string;
    date: string;
    originalCheckIn: string;
    originalCheckOut: string;
    requestedCheckIn: string;
    requestedCheckOut: string;
    approverName: string;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send attendance correction approved email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '✅ Yêu cầu điều chỉnh chấm công đã được duyệt',
        template: './attendance-correction-approved',
        context: data,
      });
      this.logger.log(`✅ Sent attendance correction approved email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send attendance correction approved email to ${to}:`, error.message);
    }
  }

  /**
   * Send attendance correction rejection
   */
  async sendAttendanceCorrectionRejected(to: string, data: {
    employeeName: string;
    date: string;
    approverName: string;
    reason: string;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send attendance correction rejected email to ${to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to,
        subject: '❌ Yêu cầu điều chỉnh chấm công bị từ chối',
        template: './attendance-correction-rejected',
        context: data,
      });
      this.logger.log(`✅ Sent attendance correction rejected email to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send attendance correction rejected email to ${to}:`, error.message);
    }
  }

  /**
   * Generic send mail method for custom emails
   */
  async sendMail(options: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }) {
    if (!this.isEnabled) {
      this.logger.debug(`[DISABLED] Would send email to ${options.to}`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: `./${options.template}`,
        context: options.context,
      });
      this.logger.log(`✅ Sent email to ${options.to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error.message);
      throw error;
    }
  }
}
