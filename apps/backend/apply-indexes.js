const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  try {
    console.log('🚀 Starting index optimization...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '005_add_advanced_indexes', 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Applying advanced indexes...');
    console.log('   This may take a few minutes depending on data size.\n');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        // Skip comments and empty lines
        if (statement.startsWith('--') || statement.trim().length === 0) {
          continue;
        }

        // Execute the statement
        await prisma.$executeRawUnsafe(statement + ';');
        
        // Extract index name for logging
        const indexMatch = statement.match(/CREATE INDEX.*?"([^"]+)"/i);
        const analyzeMatch = statement.match(/ANALYZE "([^"]+)"/i);
        const vacuumMatch = statement.match(/VACUUM ANALYZE "([^"]+)"/i);
        
        if (indexMatch) {
          console.log(`✅ Created index: ${indexMatch[1]}`);
          successCount++;
        } else if (vacuumMatch) {
          console.log(`🧹 Vacuumed table: ${vacuumMatch[1]}`);
          successCount++;
        } else if (analyzeMatch) {
          console.log(`📊 Analyzed table: ${analyzeMatch[1]}`);
          successCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        // Skip if index already exists
        if (error.message.includes('already exists')) {
          skipCount++;
        } else {
          console.error(`❌ Error executing statement:`, error.message);
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Successfully applied: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);

    // Get index statistics
    console.log('\n📊 Checking index statistics...\n');
    
    try {
      const indexStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 20;
      `;

      console.log('Top 20 Largest Indexes:');
      console.table(indexStats);
    } catch (error) {
      console.log('⚠️  Could not fetch index statistics (this is normal)');
    }

    try {
      // Count total indexes
      const indexCount = await prisma.$queryRaw`
        SELECT COUNT(*) as total_indexes
        FROM pg_indexes
        WHERE schemaname = 'public';
      `;

      console.log(`\n📊 Total indexes in database: ${indexCount[0].total_indexes}`);
    } catch (error) {
      console.log('⚠️  Could not count indexes');
    }

    console.log('\n🎉 Index optimization completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   - Monitor query performance with EXPLAIN ANALYZE');
    console.log('   - Run VACUUM ANALYZE periodically for optimal performance');
    console.log('   - Check slow query logs to identify bottlenecks');
    console.log('   - Consider adding more indexes based on actual usage patterns\n');

  } catch (error) {
    console.error('❌ Error applying indexes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
