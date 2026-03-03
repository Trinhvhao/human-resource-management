import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding work schedules...');

    // Get all active employees
    const employees = await prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, fullName: true, employeeCode: true },
    });

    console.log(`Found ${employees.length} active employees`);

    if (employees.length === 0) {
        console.log('⚠️  No active employees found. Please seed employees first.');
        return;
    }

    // Clear existing schedules (optional - comment out if you want to keep existing data)
    const deletedCount = await prisma.workSchedule.deleteMany({});
    console.log(`🗑️  Deleted ${deletedCount.count} existing schedules`);

    // Generate schedules for the next 30 days
    const today = new Date();
    const schedules: any[] = [];

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const date = new Date(today);
        date.setDate(today.getDate() + dayOffset);

        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            continue;
        }

        // Create schedules for all employees
        for (const employee of employees) {
            // Randomly assign shift types for variety
            const shiftTypes = ['FULL_DAY', 'MORNING', 'AFTERNOON'];
            const randomShift = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];

            let startTime: Date;
            let endTime: Date;

            switch (randomShift) {
                case 'MORNING':
                    startTime = new Date(date);
                    startTime.setHours(8, 0, 0, 0);
                    endTime = new Date(date);
                    endTime.setHours(12, 0, 0, 0);
                    break;
                case 'AFTERNOON':
                    startTime = new Date(date);
                    startTime.setHours(13, 0, 0, 0);
                    endTime = new Date(date);
                    endTime.setHours(17, 30, 0, 0);
                    break;
                case 'FULL_DAY':
                default:
                    startTime = new Date(date);
                    startTime.setHours(8, 30, 0, 0);
                    endTime = new Date(date);
                    endTime.setHours(17, 30, 0, 0);
                    break;
            }

            schedules.push({
                employeeId: employee.id,
                date: new Date(date.setHours(0, 0, 0, 0)),
                shiftType: randomShift,
                startTime,
                endTime,
                isWorkDay: true,
                notes: null,
            });
        }
    }

    console.log(`📅 Creating ${schedules.length} work schedules...`);

    // Batch create schedules
    const batchSize = 100;
    let created = 0;

    for (let i = 0; i < schedules.length; i += batchSize) {
        const batch = schedules.slice(i, i + batchSize);
        await prisma.workSchedule.createMany({
            data: batch,
            skipDuplicates: true,
        });
        created += batch.length;
        console.log(`  ✓ Created ${created}/${schedules.length} schedules`);
    }

    console.log('✅ Work schedules seeded successfully!');

    // Show summary
    const summary = await prisma.workSchedule.groupBy({
        by: ['shiftType'],
        _count: true,
    });

    console.log('\n📊 Summary by shift type:');
    summary.forEach(item => {
        console.log(`  ${item.shiftType}: ${item._count} schedules`);
    });

    // Show date range
    const firstSchedule = await prisma.workSchedule.findFirst({
        orderBy: { date: 'asc' },
    });
    const lastSchedule = await prisma.workSchedule.findFirst({
        orderBy: { date: 'desc' },
    });

    if (firstSchedule && lastSchedule) {
        console.log(`\n📆 Date range: ${firstSchedule.date.toLocaleDateString('vi-VN')} - ${lastSchedule.date.toLocaleDateString('vi-VN')}`);
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding work schedules:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
