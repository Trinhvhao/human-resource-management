const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAdditionalData() {
  try {
    console.log('🔄 Starting additional data seeding...\n');

    // Get all employees and users
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true },
    });

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`📋 Found ${employees.length} active employees\n`);

    const now = new Date();

    // ========== 1. LEAVE REQUESTS ==========
    console.log('📝 Creating leave requests...');
    
    const leaveTypes = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY'];
    const leaveStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    
    const leaveRequests = [];
    for (let i = 0; i < Math.min(15, employees.length); i++) {
      const employee = employees[i];
      const status = leaveStatuses[i % 3];
      const leaveType = leaveTypes[i % 4];
      const startDate = new Date(now.getTime() + (i * 3 - 10) * 24 * 60 * 60 * 1000);
      const totalDays = 1 + (i % 5);
      const endDate = new Date(startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);

      leaveRequests.push({
        employeeId: employee.id,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: `Lý do nghỉ phép ${leaveType.toLowerCase()}`,
        status,
        approverId: status !== 'PENDING' ? adminUser.id : null,
        approvedAt: status !== 'PENDING' ? new Date() : null,
        rejectedReason: status === 'REJECTED' ? 'Không đủ điều kiện' : null,
      });
    }

    await prisma.leaveRequest.createMany({ data: leaveRequests });
    console.log(`✅ Created ${leaveRequests.length} leave requests`);
    console.log(`   - Pending: ${leaveRequests.filter(l => l.status === 'PENDING').length}`);
    console.log(`   - Approved: ${leaveRequests.filter(l => l.status === 'APPROVED').length}`);
    console.log(`   - Rejected: ${leaveRequests.filter(l => l.status === 'REJECTED').length}\n`);

    // ========== 2. OVERTIME REQUESTS ==========
    console.log('⏰ Creating overtime requests...');
    
    const overtimeRequests = [];
    for (let i = 0; i < Math.min(12, employees.length); i++) {
      const employee = employees[i];
      const status = leaveStatuses[i % 3];
      const date = new Date(now.getTime() - (i * 2) * 24 * 60 * 60 * 1000);
      const hours = 2 + (i % 4);
      const startTime = new Date(date);
      startTime.setHours(18, 0, 0, 0);
      const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

      overtimeRequests.push({
        employeeId: employee.id,
        date,
        startTime,
        endTime,
        hours,
        reason: `Hoàn thành dự án quan trọng`,
        status,
        approverId: status !== 'PENDING' ? adminUser.id : null,
        approvedAt: status !== 'PENDING' ? new Date() : null,
        rejectedReason: status === 'REJECTED' ? 'Không cần thiết' : null,
      });
    }

    await prisma.overtimeRequest.createMany({ data: overtimeRequests });
    console.log(`✅ Created ${overtimeRequests.length} overtime requests`);
    console.log(`   - Pending: ${overtimeRequests.filter(o => o.status === 'PENDING').length}`);
    console.log(`   - Approved: ${overtimeRequests.filter(o => o.status === 'APPROVED').length}`);
    console.log(`   - Rejected: ${overtimeRequests.filter(o => o.status === 'REJECTED').length}\n`);

    // ========== 3. REWARDS ==========
    console.log('🏆 Creating rewards...');
    
    const rewardTypes = ['BONUS', 'CERTIFICATE', 'PROMOTION', 'GIFT'];
    const rewards = [];
    
    for (let i = 0; i < Math.min(8, employees.length); i++) {
      const employee = employees[i];
      const rewardType = rewardTypes[i % 4];
      const amount = rewardType === 'BONUS' ? 1000000 + i * 500000 : null;

      rewards.push({
        employeeId: employee.id,
        rewardType,
        reason: `Hoàn thành xuất sắc nhiệm vụ quý ${Math.ceil((now.getMonth() + 1) / 3)}`,
        amount: amount || 0,
        rewardDate: new Date(now.getTime() - i * 15 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
      });
    }

    await prisma.reward.createMany({ data: rewards });
    console.log(`✅ Created ${rewards.length} rewards`);
    console.log(`   - Bonus: ${rewards.filter(r => r.rewardType === 'BONUS').length}`);
    console.log(`   - Certificate: ${rewards.filter(r => r.rewardType === 'CERTIFICATE').length}`);
    console.log(`   - Promotion: ${rewards.filter(r => r.rewardType === 'PROMOTION').length}`);
    console.log(`   - Gift: ${rewards.filter(r => r.rewardType === 'GIFT').length}\n`);

    // ========== 4. DISCIPLINES ==========
    console.log('⚠️  Creating disciplines...');
    
    const disciplineTypes = ['WARNING', 'SUSPENSION', 'FINE', 'TERMINATION'];
    const disciplines = [];
    
    for (let i = 0; i < Math.min(5, employees.length); i++) {
      const employee = employees[i + 10]; // Different employees
      const disciplineType = disciplineTypes[i % 4];
      const amount = disciplineType === 'FINE' ? 500000 + i * 200000 : null;

      disciplines.push({
        employeeId: employee.id,
        disciplineType,
        reason: `Vi phạm nội quy công ty`,
        amount: amount || 0,
        disciplineDate: new Date(now.getTime() - i * 20 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
      });
    }

    await prisma.discipline.createMany({ data: disciplines });
    console.log(`✅ Created ${disciplines.length} disciplines`);
    console.log(`   - Warning: ${disciplines.filter(d => d.disciplineType === 'WARNING').length}`);
    console.log(`   - Suspension: ${disciplines.filter(d => d.disciplineType === 'SUSPENSION').length}`);
    console.log(`   - Fine: ${disciplines.filter(d => d.disciplineType === 'FINE').length}\n`);

    // ========== SUMMARY ==========
    console.log('� Suemmary:');
    console.log(`   - Leave Requests: ${leaveRequests.length}`);
    console.log(`   - Overtime Requests: ${overtimeRequests.length}`);
    console.log(`   - Rewards: ${rewards.length}`);
    console.log(`   - Disciplines: ${disciplines.length}`);

    console.log('\n🎉 Additional data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding additional data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdditionalData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
