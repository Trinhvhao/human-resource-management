import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const ExcelJS = require('exceljs');

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export employees list to Excel
   */
  async exportEmployees(filters?: {
    departmentId?: string;
    status?: string;
    position?: string;
  }): Promise<Buffer> {
    const where: any = {};
    
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.status) where.status = filters.status;
    if (filters?.position) where.position = { contains: filters.position };

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        department: { select: { name: true } },
        user: { select: { email: true, role: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách nhân viên');

    // Set column widths
    worksheet.columns = [
      { header: 'Mã NV', key: 'code', width: 12 },
      { header: 'Họ và tên', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Số điện thoại', key: 'phone', width: 15 },
      { header: 'Phòng ban', key: 'department', width: 25 },
      { header: 'Chức vụ', key: 'position', width: 20 },
      { header: 'Lương cơ bản', key: 'salary', width: 15 },
      { header: 'Ngày vào làm', key: 'joinDate', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data rows
    employees.forEach((emp) => {
      worksheet.addRow({
        code: emp.employeeCode,
        fullName: emp.fullName,
        email: emp.user?.email || emp.email,
        phone: emp.phone,
        department: emp.department?.name || 'N/A',
        position: emp.position,
        salary: Number(emp.baseSalary),
        joinDate: emp.startDate ? new Date(emp.startDate).toLocaleDateString('vi-VN') : '',
        status: emp.status,
      });
    });

    // Format salary column as currency
    worksheet.getColumn('salary').numFmt = '#,##0 "₫"';

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add summary row
    const summaryRow = worksheet.addRow({
      code: '',
      fullName: `Tổng số: ${employees.length} nhân viên`,
      email: '',
      phone: '',
      department: '',
      position: '',
      salary: '',
      joinDate: '',
      status: '',
    });
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Export attendance report to Excel
   */
  async exportAttendance(month: number, year: number, employeeId?: string): Promise<Buffer> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: any = {
      date: { gte: startDate, lte: endDate },
    };
    if (employeeId) where.employeeId = employeeId;

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { date: 'asc' }],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Chấm công ${month}/${year}`);

    // Set columns
    worksheet.columns = [
      { header: 'Mã NV', key: 'code', width: 12 },
      { header: 'Họ và tên', key: 'fullName', width: 25 },
      { header: 'Phòng ban', key: 'department', width: 25 },
      { header: 'Ngày', key: 'date', width: 12 },
      { header: 'Check-in', key: 'checkIn', width: 12 },
      { header: 'Check-out', key: 'checkOut', width: 12 },
      { header: 'Giờ làm', key: 'workHours', width: 10 },
      { header: 'Đi muộn', key: 'isLate', width: 10 },
      { header: 'Về sớm', key: 'isEarly', width: 10 },
      { header: 'Trạng thái', key: 'status', width: 12 },
      { header: 'Ghi chú', key: 'notes', width: 30 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data
    attendances.forEach((att) => {
      const row = worksheet.addRow({
        code: att.employee.employeeCode,
        fullName: att.employee.fullName,
        department: att.employee.department?.name || 'N/A',
        date: new Date(att.date).toLocaleDateString('vi-VN'),
        checkIn: att.checkIn ? new Date(att.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
        checkOut: att.checkOut ? new Date(att.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
        workHours: att.workHours ? Number(att.workHours).toFixed(1) : '',
        isLate: att.isLate ? 'Có' : '',
        isEarly: att.isEarlyLeave ? 'Có' : '',
        status: att.status,
        notes: att.notes || '',
      });

      // Highlight late/early
      if (att.isLate) {
        row.getCell('isLate').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' },
        };
      }
      if (att.isEarlyLeave) {
        row.getCell('isEarly').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' },
        };
      }
    });

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add summary
    const summaryRow = worksheet.addRow({
      code: '',
      fullName: `Tổng số: ${attendances.length} bản ghi`,
      department: '',
      date: '',
      checkIn: '',
      checkOut: '',
      workHours: '',
      isLate: '',
      isEarly: '',
      status: '',
      notes: '',
    });
    summaryRow.font = { bold: true };

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Export payroll to Excel
   */
  async exportPayroll(payrollId: string): Promise<Buffer> {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        items: {
          include: {
            employee: {
              select: {
                employeeCode: true,
                fullName: true,
                department: { select: { name: true } },
              },
            },
          },
          orderBy: { employee: { employeeCode: 'asc' } },
        },
      },
    });

    if (!payroll) {
      throw new Error('Payroll not found');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Bảng lương ${payroll.month}/${payroll.year}`);

    // Set columns
    worksheet.columns = [
      { header: 'Mã NV', key: 'code', width: 12 },
      { header: 'Họ và tên', key: 'fullName', width: 25 },
      { header: 'Phòng ban', key: 'department', width: 25 },
      { header: 'Lương CB', key: 'baseSalary', width: 15 },
      { header: 'Ngày công', key: 'workDays', width: 12 },
      { header: 'Phụ cấp', key: 'allowances', width: 15 },
      { header: 'Thưởng', key: 'bonus', width: 15 },
      { header: 'Tăng ca', key: 'overtime', width: 15 },
      { header: 'Khấu trừ', key: 'deduction', width: 15 },
      { header: 'Bảo hiểm', key: 'insurance', width: 15 },
      { header: 'Thuế TNCN', key: 'tax', width: 15 },
      { header: 'Thực nhận', key: 'netSalary', width: 18 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF5B9BD5' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    let totalNetSalary = 0;

    // Add data
    payroll.items.forEach((item) => {
      worksheet.addRow({
        code: item.employee.employeeCode,
        fullName: item.employee.fullName,
        department: item.employee.department?.name || 'N/A',
        baseSalary: Number(item.baseSalary),
        workDays: `${item.actualWorkDays}/${item.workDays}`,
        allowances: Number(item.allowances),
        bonus: Number(item.bonus),
        overtime: Number(item.overtimePay),
        deduction: Number(item.deduction),
        insurance: Number(item.insurance),
        tax: Number(item.tax),
        netSalary: Number(item.netSalary),
      });
      totalNetSalary += Number(item.netSalary);
    });

    // Format currency columns
    ['baseSalary', 'allowances', 'bonus', 'overtime', 'deduction', 'insurance', 'tax', 'netSalary'].forEach((col) => {
      worksheet.getColumn(col).numFmt = '#,##0 "₫"';
    });

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add summary
    const summaryRow = worksheet.addRow({
      code: '',
      fullName: `Tổng số: ${payroll.items.length} nhân viên`,
      department: '',
      baseSalary: '',
      workDays: '',
      allowances: '',
      bonus: '',
      overtime: '',
      deduction: '',
      insurance: '',
      tax: '',
      netSalary: totalNetSalary,
    });
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEB9C' },
    };
    summaryRow.getCell('netSalary').numFmt = '#,##0 "₫"';

    return await workbook.xlsx.writeBuffer();
  }

  /**
   * Export leave requests to Excel
   */
  async exportLeaveRequests(filters?: {
    status?: string;
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Buffer> {
    const where: any = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.startDate || filters?.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = filters.startDate;
      if (filters.endDate) where.startDate.lte = filters.endDate;
    }

    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Đơn nghỉ phép');

    worksheet.columns = [
      { header: 'Mã NV', key: 'code', width: 12 },
      { header: 'Họ và tên', key: 'fullName', width: 25 },
      { header: 'Phòng ban', key: 'department', width: 25 },
      { header: 'Loại phép', key: 'leaveType', width: 15 },
      { header: 'Từ ngày', key: 'startDate', width: 12 },
      { header: 'Đến ngày', key: 'endDate', width: 12 },
      { header: 'Số ngày', key: 'totalDays', width: 10 },
      { header: 'Lý do', key: 'reason', width: 35 },
      { header: 'Trạng thái', key: 'status', width: 12 },
      { header: 'Ngày tạo', key: 'createdAt', width: 15 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFED7D31' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data
    leaveRequests.forEach((req) => {
      const row = worksheet.addRow({
        code: req.employee.employeeCode,
        fullName: req.employee.fullName,
        department: req.employee.department?.name || 'N/A',
        leaveType: req.leaveType,
        startDate: new Date(req.startDate).toLocaleDateString('vi-VN'),
        endDate: new Date(req.endDate).toLocaleDateString('vi-VN'),
        totalDays: req.totalDays,
        reason: req.reason,
        status: req.status,
        createdAt: new Date(req.createdAt).toLocaleDateString('vi-VN'),
      });

      // Color code by status
      const statusCell = row.getCell('status');
      if (req.status === 'APPROVED') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' },
        };
      } else if (req.status === 'REJECTED') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' },
        };
      } else if (req.status === 'PENDING') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB9C' },
        };
      }
    });

    // Add borders
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Add summary
    const summaryRow = worksheet.addRow({
      code: '',
      fullName: `Tổng số: ${leaveRequests.length} đơn`,
      department: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      totalDays: leaveRequests.reduce((sum, req) => sum + req.totalDays, 0),
      reason: '',
      status: '',
      createdAt: '',
    });
    summaryRow.font = { bold: true };

    return await workbook.xlsx.writeBuffer();
  }
}
