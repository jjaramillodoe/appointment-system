import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Checking .gitignore configuration...\n');

const sensitivePatterns = [
  '.env',
  '.env.local',
  '.env.production',
  'database-backups/',
  '.vercel/',
  '*.tar.gz',
  '*.key',
  '*.pem',
  'secrets/',
];

const gitignorePath = path.join(process.cwd(), '.gitignore');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

console.log('✅ .gitignore file found\n');

// Check for sensitive patterns
console.log('📋 Checking for sensitive file patterns:');
sensitivePatterns.forEach(pattern => {
  const isIgnored = gitignoreContent.includes(pattern) || 
                    gitignoreContent.includes(pattern.replace('*', '')) ||
                    gitignoreContent.includes(pattern.replace('/', ''));
  const status = isIgnored ? '✅' : '❌';
  console.log(`   ${status} ${pattern}`);
});

// Check for actual sensitive files
console.log('\n🔒 Checking for actual sensitive files:');

const checkFile = (filePath: string, description: string) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.isFile()) {
      console.log(`   ⚠️  ${description}: ${filePath} EXISTS`);
      console.log(`      Make sure this is in .gitignore!`);
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(fullPath);
      console.log(`   ⚠️  ${description}: ${filePath} EXISTS (${files.length} items)`);
      console.log(`      Make sure this directory is in .gitignore!`);
    }
  } else {
    console.log(`   ✅ ${description}: ${filePath} (not found)`);
  }
};

checkFile('.env', 'Environment file');
checkFile('.env.local', 'Local environment file');
checkFile('.env.production', 'Production environment file');
checkFile('database-backups', 'Database backups directory');
checkFile('.vercel', 'Vercel directory');

console.log('\n📝 Summary:');
console.log('   - All .env files should be ignored');
console.log('   - Database backups should be ignored');
console.log('   - Vercel files should be ignored');
console.log('   - Scripts directory should be committed (useful code)');
console.log('\n💡 To verify before pushing to GitHub:');
console.log('   git status');
console.log('   git check-ignore -v .env.local .env.production database-backups/');
