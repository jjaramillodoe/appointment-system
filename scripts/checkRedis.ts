import dotenv from 'dotenv';
import { createClient } from 'redis';

// Load environment variables
dotenv.config({ path: '.env.local' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

async function checkRedis() {
  console.log('🔍 Checking Redis connection...');
  console.log(`   REDIS_URL: ${REDIS_URL}`);
  console.log(`   REDIS_ENABLED: ${REDIS_ENABLED}`);
  console.log('');

  if (!REDIS_ENABLED) {
    console.log('ℹ️  Redis is disabled (REDIS_ENABLED=false)');
    console.log('   The application will work without Redis caching.');
    return;
  }

  try {
    const client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 3000,
      },
    });

    console.log('⏳ Attempting to connect...');
    await client.connect();
    console.log('✅ Redis connection successful!');

    // Test a simple operation
    await client.set('test:connection', 'ok', { EX: 10 });
    const value = await client.get('test:connection');
    console.log(`✅ Redis read/write test: ${value === 'ok' ? 'PASSED' : 'FAILED'}`);

    // Get Redis info
    const info = await client.info('server');
    console.log('\n📊 Redis Server Info:');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    if (versionMatch) {
      console.log(`   Version: ${versionMatch[1]}`);
    }

    await client.quit();
    console.log('\n✅ Redis is ready to use!');
  } catch (error: any) {
    console.log('❌ Redis connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log('');
    console.log('💡 Solutions:');
    console.log('   1. Install and start Redis:');
    console.log('      - macOS: brew install redis && brew services start redis');
    console.log('      - Linux: sudo apt-get install redis-server && sudo systemctl start redis');
    console.log('      - Docker: docker run -d -p 6379:6379 redis');
    console.log('');
    console.log('   2. Or disable Redis caching by adding to .env.local:');
    console.log('      REDIS_ENABLED=false');
    console.log('');
    console.log('   The application will work without Redis, but caching will be disabled.');
  }
}

checkRedis();

