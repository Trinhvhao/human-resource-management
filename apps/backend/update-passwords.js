const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function updatePasswords() {
  try {
    console.log('🔧 Updating user passwords...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Update admin user
    const admin = await prisma.user.updateMany({
      where: { 
        OR: [
          { email: 'admin@2th.com' },
          { email: 'admin@company.com' }
        ]
      },
      data: { 
        passwordHash: hashedPassword,
        isActive: true 
      },
    });

    // Update HR user  
    const hr = await prisma.user.updateMany({
      where: { 
        OR: [
          { email: 'hr@2th.com' },
          { email: 'hr@company.com' }
        ]
      },
      data: { 
        passwordHash: hashedPassword,
        isActive: true 
      },
    });

    console.log(`✅ Updated ${admin.count} admin user(s)`);
    console.log(`✅ Updated ${hr.count} HR user(s)`);
    console.log('\n📧 Test credentials:');
    console.log('Admin: admin@2th.com OR admin@company.com / password123');
    console.log('HR: hr@2th.com OR hr@company.com / password123');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updatePasswords();
