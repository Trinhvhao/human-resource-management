const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create departments
    const itDept = await prisma.department.upsert({
      where: { code: 'IT' },
      update: {},
      create: {
        code: 'IT',
        name: 'Phòng Công nghệ Thông tin',
        description: 'Quản lý hệ thống IT',
        isActive: true,
      },
    });

    const hrDept = await prisma.department.upsert({
      where: { code: 'HR' },
      update: {},
      create: {
        code: 'HR',
        name: 'Phòng Nhân sự',
        description: 'Quản lý nhân sự',
        isActive: true,
      },
    });

    console.log('✅ Departments created');

    // Create employees
    const employee1 = await prisma.employee.upsert({
      where: { email: 'admin@2th.com' },
      update: {},
      create: {
        employeeCode: 'EMP26001',
        fullName: 'Nguyễn Văn Admin',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Nam',
        idCard: '001090001234',
        address: 'Hà Nội',
        phone: '0901234567',
        email: 'admin@2th.com',
        departmentId: itDept.id,
        position: 'Giám đốc IT',
        startDate: new Date('2020-01-01'),
        status: 'ACTIVE',
        baseSalary: 30000000,
      },
    });

    const employee2 = await prisma.employee.upsert({
      where: { email: 'hr@2th.com' },
      update: {},
      create: {
        employeeCode: 'EMP26002',
        fullName: 'Trần Thị HR',
        dateOfBirth: new Date('1992-05-15'),
        gender: 'Nữ',
        idCard: '001092005678',
        address: 'Hà Nội',
        phone: '0902345678',
        email: 'hr@2th.com',
        departmentId: hrDept.id,
        position: 'Trưởng phòng Nhân sự',
        startDate: new Date('2021-03-01'),
        status: 'ACTIVE',
        baseSalary: 25000000,
      },
    });

    console.log('✅ Employees created');

    // Create users with simple password
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@2th.com' },
      update: { passwordHash: hashedPassword },
      create: {
        email: 'admin@2th.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        employeeId: employee1.id,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'hr@2th.com' },
      update: { passwordHash: hashedPassword },
      create: {
        email: 'hr@2th.com',
        passwordHash: hashedPassword,
        role: 'HR_MANAGER',
        employeeId: employee2.id,
        isActive: true,
      },
    });

    console.log('✅ Users created');

    // Create holidays for 2026
    const holidays = [
      { name: 'Tết Dương lịch', date: new Date('2026-01-01'), year: 2026 },
      { name: 'Giải phóng miền Nam', date: new Date('2026-04-30'), year: 2026 },
      { name: 'Quốc tế Lao động', date: new Date('2026-05-01'), year: 2026 },
      { name: 'Quốc khánh', date: new Date('2026-09-02'), year: 2026 },
    ];

    for (const holiday of holidays) {
      await prisma.holiday.upsert({
        where: { date: holiday.date },
        update: {},
        create: holiday,
      });
    }

    console.log('✅ Holidays created');

    // Initialize leave balances for 2026
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_year: {
          employeeId: employee1.id,
          year: 2026,
        },
      },
      update: {},
      create: {
        employeeId: employee1.id,
        year: 2026,
        annualLeave: 12,
        sickLeave: 30,
        usedAnnual: 0,
        usedSick: 0,
        carriedOver: 0,
      },
    });

    await prisma.leaveBalance.upsert({
      where: {
        employeeId_year: {
          employeeId: employee2.id,
          year: 2026,
        },
      },
      update: {},
      create: {
        employeeId: employee2.id,
        year: 2026,
        annualLeave: 12,
        sickLeave: 30,
        usedAnnual: 0,
        usedSick: 0,
        carriedOver: 0,
      },
    });

    console.log('✅ Leave balances initialized');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Test credentials:');
    console.log('Admin: admin@2th.com / password123');
    console.log('HR: hr@2th.com / password123');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seed();
