import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    console.log('DIRECT_URL:', process.env.DIRECT_URL?.substring(0, 50) + '...');
    
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    const count = await prisma.department.count();
    console.log(`📊 Found ${count} departments`);
    
    await prisma.$disconnect();
    console.log('👋 Disconnected');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

testConnection();
