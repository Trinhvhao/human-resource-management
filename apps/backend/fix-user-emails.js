const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function fixUserEmails() {
  try {
    console.log('🔧 Updating user emails to match frontend...\n');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Update admin user email
    const admin = await prisma.user.update({
      where: { email: 'admin@company.com' },
      data: { 
        email: 'admin@2th.com',
        passwordHash: hashedPassword 
      },
    });
    console.log(`✅ Updated admin: ${admin.email}`);

    // Update HR user email
    const hr = await prisma.user.update({
      where: { email: 'hr@company.com' },
      data: { 
        email: 'hr@2th.com',
        passwordHash: hashedPassword 
      },
    });
    console.log(`✅ Updated HR: ${hr.email}`);

    // Also update employee emails
    await prisma.employee.updateMany({
      where: { email: 'admin@company.com' },
      data: { email: 'admin@2th.com' }
    });

    await prisma.employee.updateMany({
      where: { email: 'hr@company.com' },
      data: { email: 'hr@2th.com' }
    });

    console.log('✅ Updated employee emails');
    console.log('\n📧 New credentials:');
    console.log('Admin: admin@2th.com / password123');
    console.log('HR: hr@2th.com / password123');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixUserEmails();
