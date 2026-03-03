import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Payroll Workflow data (Simple)...\n');

    // Get existing users
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@company.com' },
    });

    const hrUser = await prisma.user.findUnique({
        where: { email: 'hr@company.com' },
    });

    if (!adminUser || !hrUser) {
        console.log('❌ Admin or HR user not found. Please run main seed first.');
        return;
    }

    console.log('✅ Found admin and HR users');

    // Get active employees (including test employees)
    const employees = await prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { employeeCode: 'asc' },
        // No limit - get ALL active employees
    });

    if (employees.length === 0) {
        console.log('❌ No active employees found. Please create employees first.');
        return;
    }

    console.log(`✅ Found ${employees.length} active employees\n`);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Helper function to create payroll
    async function createPayroll(
        month: number,
        year: number,
        status: any,
        submittedBy?: string,
        submittedAt?: Date,
        approvedBy?: string,
        approvedAt?: Date,
        rejectedBy?: string,
        rejectedAt?: Date,
        rejectionReason?: string,
        lockedBy?: string,
        lockedAt?: Date,
    ) {
        // Check if exists
        const existing = await prisma.payroll.findFirst({
            where: { month, year },
        });

        if (existing) {
            console.log(`⏭️  Payroll ${month}/${year} already exists, skipping...`);
            return null;
        }

        // Create payroll
        const payroll = await prisma.payroll.create({
            data: {
                month,
                year,
                status,
                totalAmount: 0,
                submittedBy,
                submittedAt,
                approvedBy,
                approvedAt,
                rejectedBy,
                rejectedAt,
                rejectionReason,
                lockedBy,
                lockedAt,
                notes: `Bảng lương test - ${status}`,
            },
        });

        // Create items
        let totalAmount = 0;
        for (const employee of employees) {
            const baseSalary = Number(employee.baseSalary);
            const allowances = 2000000;
            const bonus = status === 'DRAFT' ? 0 : 1000000;
            const deduction = 0;
            const overtimeHours = status === 'DRAFT' ? 0 : 5;

            // Calculate overtime pay
            const hourlyRate = baseSalary / (22 * 8); // 22 work days, 8 hours per day
            const overtimePay = overtimeHours * hourlyRate * 1.5;

            // Calculate gross salary (pro-rated based on actual work days)
            const actualWorkDays = 22; // Full month for test data
            const proRatedSalary = baseSalary * (actualWorkDays / 22);
            const grossSalary = proRatedSalary + allowances + bonus + overtimePay;

            // Calculate insurance (10.5% with cap at 36M)
            const insuranceBase = Math.min(grossSalary, 36000000);
            const insurance = insuranceBase * 0.105;

            // Calculate taxable income
            const personalDeduction = 11000000;
            const taxableIncome = Math.max(0, grossSalary - insurance - personalDeduction);

            // Calculate tax (simplified progressive)
            let tax = 0;
            if (taxableIncome <= 5000000) {
                tax = taxableIncome * 0.05;
            } else if (taxableIncome <= 10000000) {
                tax = 5000000 * 0.05 + (taxableIncome - 5000000) * 0.10;
            } else if (taxableIncome <= 18000000) {
                tax = 5000000 * 0.05 + 5000000 * 0.10 + (taxableIncome - 10000000) * 0.15;
            } else {
                tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + (taxableIncome - 18000000) * 0.20;
            }

            // Calculate net salary
            const netSalary = grossSalary - insurance - tax;
            totalAmount += netSalary;

            await prisma.payrollItem.create({
                data: {
                    payrollId: payroll.id,
                    employeeId: employee.id,
                    baseSalary: employee.baseSalary,
                    workDays: 22,
                    actualWorkDays: actualWorkDays,
                    allowances,
                    bonus,
                    deduction,
                    overtimeHours,
                    overtimePay: Math.round(overtimePay),
                    insurance: Math.round(insurance),
                    tax: Math.round(tax),
                    netSalary: Math.round(netSalary),
                },
            });
        }

        // Update total
        await prisma.payroll.update({
            where: { id: payroll.id },
            data: { totalAmount },
        });

        console.log(`✅ Created ${status} payroll for ${month}/${year}`);
        return payroll;
    }

    // 1. DRAFT - Current month
    await createPayroll(currentMonth, currentYear, 'DRAFT');

    // 2. PENDING_APPROVAL - Last month
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    await createPayroll(
        lastMonth,
        lastMonthYear,
        'PENDING_APPROVAL',
        hrUser.id,
        new Date(),
    );

    // 3. APPROVED - 2 months ago
    const twoMonthsAgo = currentMonth <= 2 ? 12 - (2 - currentMonth) : currentMonth - 2;
    const twoMonthsAgoYear = currentMonth <= 2 ? currentYear - 1 : currentYear;
    await createPayroll(
        twoMonthsAgo,
        twoMonthsAgoYear,
        'APPROVED',
        hrUser.id,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        adminUser.id,
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    );

    // 4. REJECTED - 3 months ago
    const threeMonthsAgo = currentMonth <= 3 ? 12 - (3 - currentMonth) : currentMonth - 3;
    const threeMonthsAgoYear = currentMonth <= 3 ? currentYear - 1 : currentYear;
    await createPayroll(
        threeMonthsAgo,
        threeMonthsAgoYear,
        'REJECTED',
        hrUser.id,
        new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        undefined,
        undefined,
        adminUser.id,
        new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        'Có sai sót trong tính lương. Vui lòng kiểm tra lại.',
    );

    // 5. LOCKED - 4 months ago
    const fourMonthsAgo = currentMonth <= 4 ? 12 - (4 - currentMonth) : currentMonth - 4;
    const fourMonthsAgoYear = currentMonth <= 4 ? currentYear - 1 : currentYear;
    await createPayroll(
        fourMonthsAgo,
        fourMonthsAgoYear,
        'LOCKED',
        hrUser.id,
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        adminUser.id,
        new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        undefined,
        undefined,
        undefined,
        adminUser.id,
        new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    );

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Payroll Status Summary:');
    console.log(`   DRAFT: ${currentMonth}/${currentYear}`);
    console.log(`   PENDING_APPROVAL: ${lastMonth}/${lastMonthYear}`);
    console.log(`   APPROVED: ${twoMonthsAgo}/${twoMonthsAgoYear}`);
    console.log(`   REJECTED: ${threeMonthsAgo}/${threeMonthsAgoYear}`);
    console.log(`   LOCKED: ${fourMonthsAgo}/${fourMonthsAgoYear}`);
    console.log('\n📋 Test with existing accounts:');
    console.log('   ADMIN: admin@company.com');
    console.log('   HR_MANAGER: hr@company.com');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
