const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedContracts() {
  try {
    console.log('🔄 Starting contract seeding...\n');

    // Get all employees
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true },
    });

    console.log(`📋 Found ${employees.length} active employees\n`);

    if (employees.length === 0) {
      console.log('❌ No employees found. Please add employees first.');
      return;
    }

    const now = new Date();
    const contractTypes = ['PROBATION', 'FIXED_TERM', 'INDEFINITE'];
    
    // Create contracts with different expiry dates
    const contracts = [];

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      
      // Determine contract type and dates based on index
      let contractType;
      let startDate;
      let endDate;
      let status = 'ACTIVE';

      if (i < 3) {
        // 3 contracts expiring in 5-10 days (URGENT)
        contractType = 'PROBATION';
        startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
        endDate = new Date(now.getTime() + (5 + i * 2) * 24 * 60 * 60 * 1000); // 5, 7, 9 days
      } else if (i < 7) {
        // 4 contracts expiring in 15-30 days (WARNING)
        contractType = 'FIXED_TERM';
        startDate = new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000); // 300 days ago
        endDate = new Date(now.getTime() + (15 + (i - 3) * 5) * 24 * 60 * 60 * 1000); // 15, 20, 25, 30 days
      } else if (i < 10) {
        // 3 contracts expiring in 40-60 days (INFO)
        contractType = 'FIXED_TERM';
        startDate = new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000); // 200 days ago
        endDate = new Date(now.getTime() + (40 + (i - 7) * 10) * 24 * 60 * 60 * 1000); // 40, 50, 60 days
      } else if (i < 15) {
        // 5 contracts expiring in 6-12 months (SAFE)
        contractType = 'FIXED_TERM';
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 180 days ago
        endDate = new Date(now.getTime() + (180 + (i - 10) * 30) * 24 * 60 * 60 * 1000); // 6-12 months
      } else {
        // Rest have indefinite contracts (no end date)
        contractType = 'INDEFINITE';
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
        endDate = null;
      }

      contracts.push({
        employeeId: employee.id,
        contractType,
        startDate,
        endDate,
        status,
        salary: 10000000 + Math.floor(Math.random() * 20000000), // 10M - 30M
        terms: `Hợp đồng ${contractType === 'PROBATION' ? 'thử việc' : contractType === 'FIXED_TERM' ? 'có thời hạn' : 'không thời hạn'} cho ${employee.fullName}`,
      });
    }

    // Delete existing contracts
    await prisma.contract.deleteMany({});
    console.log('🗑️  Deleted existing contracts\n');

    // Create new contracts
    for (const contract of contracts) {
      await prisma.contract.create({ data: contract });
    }

    console.log('✅ Created contracts:\n');

    // Show summary
    const urgentContracts = contracts.filter(c => {
      if (!c.endDate) return false;
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 10;
    });

    const warningContracts = contracts.filter(c => {
      if (!c.endDate) return false;
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 10 && days <= 30;
    });

    const infoContracts = contracts.filter(c => {
      if (!c.endDate) return false;
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30 && days <= 60;
    });

    const safeContracts = contracts.filter(c => {
      if (!c.endDate) return false;
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 60;
    });

    const indefiniteContracts = contracts.filter(c => !c.endDate);

    console.log(`🔴 URGENT (≤10 days): ${urgentContracts.length} contracts`);
    urgentContracts.forEach(c => {
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const emp = employees.find(e => e.id === c.employeeId);
      console.log(`   - ${emp.employeeCode}: ${emp.fullName} (${days} days)`);
    });

    console.log(`\n🟠 WARNING (11-30 days): ${warningContracts.length} contracts`);
    warningContracts.forEach(c => {
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const emp = employees.find(e => e.id === c.employeeId);
      console.log(`   - ${emp.employeeCode}: ${emp.fullName} (${days} days)`);
    });

    console.log(`\n🟡 INFO (31-60 days): ${infoContracts.length} contracts`);
    infoContracts.forEach(c => {
      const days = Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const emp = employees.find(e => e.id === c.employeeId);
      console.log(`   - ${emp.employeeCode}: ${emp.fullName} (${days} days)`);
    });

    console.log(`\n🟢 SAFE (>60 days): ${safeContracts.length} contracts`);
    console.log(`⚪ INDEFINITE: ${indefiniteContracts.length} contracts`);

    console.log(`\n✅ Total contracts created: ${contracts.length}`);
    console.log('\n🎉 Contract seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding contracts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedContracts()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
