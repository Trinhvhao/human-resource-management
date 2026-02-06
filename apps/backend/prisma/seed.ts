import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  Prisma seed is disabled.');
  console.log('📝 Use: node add-admin-users.js to add admin users');
  console.log('📝 Or use: node simple-seed.js for full seed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
