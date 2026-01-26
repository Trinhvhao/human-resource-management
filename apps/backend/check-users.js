const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function checkUsers() {
  try {
    console.log('📋 Checking users in database...\n');

    const users = await prisma.user.findMany({
      include: {
        employee: {
          select: {
            fullName: true,
            email: true,
          }
        }
      }
    });

    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Employee: ${user.employee?.fullName || 'N/A'}`);
      console.log(`   Has Password: ${user.passwordHash ? 'Yes' : 'No'}`);
      console.log('');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkUsers();
