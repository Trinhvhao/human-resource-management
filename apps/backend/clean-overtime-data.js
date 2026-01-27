const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOvertimeData() {
  try {
    console.log('🧹 Cleaning overtime data...\n');

    // Xóa tất cả overtime cũ
    const deleted = await prisma.overtimeRequest.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} old overtime records\n`);

    // Lấy danh sách nhân viên
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true },
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
    const overtimeRequests = [];

    // Tạo overtime cho 3 tháng gần nhất
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();

      console.log(`📅 Creating overtime for ${targetDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}...`);

      // Mỗi tháng, 30-40% nhân viên làm thêm giờ
      const overtimeEmployees = employees
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(employees.length * 0.35));

      for (const employee of overtimeEmployees) {
        // Mỗi nhân viên làm 1-3 lần/tháng
        const timesPerMonth = 1 + Math.floor(Math.random() * 3);

        for (let i = 0; i < timesPerMonth; i++) {
          // Random ngày trong tháng (tránh cuối tuần)
          let day;
          do {
            day = 1 + Math.floor(Math.random() * daysInMonth);
            const date = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
            const dayOfWeek = date.getDay();
            // Chỉ làm thêm T2-T6
            if (dayOfWeek >= 1 && dayOfWeek <= 5) break;
          } while (true);

          const overtimeDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
          
          // Giờ làm thêm: 1-4 giờ (hợp lý)
          const hours = 1 + Math.floor(Math.random() * 4);
          
          // Thời gian: 18:00 - 22:00
          const startTime = new Date(overtimeDate);
          startTime.setHours(18, 0, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setHours(18 + hours, 0, 0, 0);

          // Status: 70% approved, 20% pending, 10% rejected
          const rand = Math.random();
          let status, approverId, approvedAt, rejectedReason;
          
          if (rand < 0.7) {
            status = 'APPROVED';
            approverId = adminUser.id;
            approvedAt = new Date(overtimeDate.getTime() + 24 * 60 * 60 * 1000); // Duyệt sau 1 ngày
          } else if (rand < 0.9) {
            status = 'PENDING';
            approverId = null;
            approvedAt = null;
          } else {
            status = 'REJECTED';
            approverId = adminUser.id;
            approvedAt = new Date(overtimeDate.getTime() + 24 * 60 * 60 * 1000);
            rejectedReason = 'Không cần thiết';
          }

          overtimeRequests.push({
            employeeId: employee.id,
            date: overtimeDate,
            startTime,
            endTime,
            hours,
            reason: `Hoàn thành dự án/công việc khẩn cấp`,
            status,
            approverId,
            approvedAt,
            rejectedReason,
          });
        }
      }
    }

    // Tạo overtime requests
    await prisma.overtimeRequest.createMany({ data: overtimeRequests });

    console.log(`\n✅ Created ${overtimeRequests.length} overtime requests\n`);

    // Thống kê
    const stats = {
      total: overtimeRequests.length,
      approved: overtimeRequests.filter(o => o.status === 'APPROVED').length,
      pending: overtimeRequests.filter(o => o.status === 'PENDING').length,
      rejected: overtimeRequests.filter(o => o.status === 'REJECTED').length,
    };

    // Tính tổng giờ theo tháng
    const currentMonth = overtimeRequests.filter(o => {
      const d = new Date(o.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const currentMonthHours = currentMonth
      .filter(o => o.status === 'APPROVED')
      .reduce((sum, o) => sum + o.hours, 0);

    console.log('📊 Statistics:');
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - Approved: ${stats.approved} (${Math.round(stats.approved/stats.total*100)}%)`);
    console.log(`   - Pending: ${stats.pending} (${Math.round(stats.pending/stats.total*100)}%)`);
    console.log(`   - Rejected: ${stats.rejected} (${Math.round(stats.rejected/stats.total*100)}%)`);
    console.log(`\n⏰ Current month (${now.toLocaleDateString('vi-VN', { month: 'long' })}):`);
    console.log(`   - Requests: ${currentMonth.length}`);
    console.log(`   - Approved hours: ${currentMonthHours}h`);
    console.log(`   - Average: ${(currentMonthHours / currentMonth.filter(o => o.status === 'APPROVED').length).toFixed(1)}h per request`);

    console.log('\n🎉 Overtime data cleaned and recreated successfully!');

  } catch (error) {
    console.error('❌ Error cleaning overtime data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanOvertimeData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
