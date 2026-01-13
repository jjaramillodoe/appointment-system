import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.production if it exists
const envPath = path.resolve(process.cwd(), '.env.production');
dotenv.config({ path: envPath });

interface MigrationConfig {
  sourceUri: string;
  targetUri: string;
  collections: string[];
  batchSize: number;
}

interface MigrationResult {
  collection: string;
  success: boolean;
  documentsMigrated: number;
  errors: string[];
}

class MongoDBMigrator {
  private sourceClient!: MongoClient;
  private targetClient!: MongoClient;
  private config: MigrationConfig;
  private results: MigrationResult[] = [];

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to source database...');
      this.sourceClient = new MongoClient(this.config.sourceUri);
      await this.sourceClient.connect();
      console.log('✅ Connected to source database');

      console.log('🔌 Connecting to target database...');
      this.targetClient = new MongoClient(this.config.targetUri);
      await this.targetClient.connect();
      console.log('✅ Connected to target database');
    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.sourceClient?.close();
      await this.targetClient?.close();
      console.log('🔌 Disconnected from databases');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  }

  async migrateCollection(collectionName: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      collection: collectionName,
      success: false,
      documentsMigrated: 0,
      errors: []
    };

    try {
      console.log(`📦 Migrating collection: ${collectionName}`);
      
      const sourceDb = this.sourceClient.db();
      const targetDb = this.targetClient.db();
      
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Get total count
      const totalCount = await sourceCollection.countDocuments();
      console.log(`   Total documents: ${totalCount}`);
      
      if (totalCount === 0) {
        console.log(`   ⚠️  Collection ${collectionName} is empty, skipping...`);
        result.success = true;
        return result;
      }
      
      // Clear target collection if it exists
      await targetCollection.deleteMany({});
      console.log(`   🗑️  Cleared target collection ${collectionName}`);
      
      // Migrate documents in batches
      let processedCount = 0;
      const cursor = sourceCollection.find({});
      
      while (await cursor.hasNext()) {
        const batch: any[] = [];
        
        // Collect batch
        for (let i = 0; i < this.config.batchSize && await cursor.hasNext(); i++) {
          const doc = await cursor.next();
          if (doc) {
            // Clean up any MongoDB-specific fields
            if (doc._id) {
              const { _id, ...docWithoutId } = doc;
              batch.push(docWithoutId);
            } else {
              batch.push(doc);
            }
          }
        }
        
        if (batch.length > 0) {
          try {
            await targetCollection.insertMany(batch);
            processedCount += batch.length;
            console.log(`   📝 Processed ${processedCount}/${totalCount} documents`);
          } catch (error: any) {
            const errorMsg = `Batch insert failed: ${error.message}`;
            console.error(`   ❌ ${errorMsg}`);
            result.errors.push(errorMsg);
          }
        }
      }
      
      result.documentsMigrated = processedCount;
      result.success = processedCount === totalCount;
      
      if (result.success) {
        console.log(`✅ Successfully migrated ${collectionName}: ${processedCount} documents`);
      } else {
        console.log(`⚠️  Partially migrated ${collectionName}: ${processedCount}/${totalCount} documents`);
      }
      
    } catch (error: any) {
      const errorMsg = `Migration failed: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
    }
    
    return result;
  }

  async migrateAll(): Promise<MigrationResult[]> {
    try {
      console.log('🚀 Starting migration process...');
      console.log(`📊 Total collections to migrate: ${this.config.collections.length}`);
      console.log('');
      
      for (const collectionName of this.config.collections) {
        const result = await this.migrateCollection(collectionName);
        this.results.push(result);
        console.log('');
      }
      
      return this.results;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async verifyMigration(): Promise<boolean> {
    try {
      console.log('🔍 Verifying migration...');
      console.log('');
      
      let allVerified = true;
      
      for (const collectionName of this.config.collections) {
        const sourceDb = this.sourceClient.db();
        const targetDb = this.targetClient.db();
        
        const sourceCount = await sourceDb.collection(collectionName).countDocuments();
        const targetCount = await targetDb.collection(collectionName).countDocuments();
        
        const status = sourceCount === targetCount ? '✅' : '❌';
        console.log(`${status} ${collectionName}: Source: ${sourceCount}, Target: ${targetCount}`);
        
        if (sourceCount !== targetCount) {
          allVerified = false;
        }
      }
      
      console.log('');
      if (allVerified) {
        console.log('✅ All collections verified successfully!');
      } else {
        console.log('⚠️  Some collections have count mismatches');
      }
      
      return allVerified;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  }

  printSummary() {
    console.log('');
    console.log('📊 Migration Summary');
    console.log('==================');
    
    let totalSuccess = 0;
    let totalDocuments = 0;
    
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.collection}: ${result.documentsMigrated} documents`);
      
      if (result.success) totalSuccess++;
      totalDocuments += result.documentsMigrated;
      
      if (result.errors.length > 0) {
        console.log(`   ⚠️  Errors: ${result.errors.join(', ')}`);
      }
    }
    
    console.log('');
    console.log(`Overall: ${totalSuccess}/${this.results.length} collections migrated successfully`);
    console.log(`Total documents migrated: ${totalDocuments}`);
  }
}

// Migration configuration
const migrationConfig: MigrationConfig = {
  sourceUri: 'mongodb://localhost:27017/appointment-system',
  targetUri: process.env.MONGODB_URI || '',
  collections: [
    'users',
    'appointments',
    'appointmentslots',
    'appointmentoptimizeds',
    'hubs',
    'hubconfigs',
    'availabilities',
    'notifications',
    'reports'
  ],
  batchSize: 1000
};

// Main migration function
async function main() {
  console.log('🔄 MongoDB Migration Tool');
  console.log('========================');
  console.log('');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    console.error('Please set it in your .env.production file or export it');
    console.error('');
    console.error('Example:');
    console.error('export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/appointment-system?retryWrites=true&w=majority"');
    process.exit(1);
  }

  console.log(`Source: ${migrationConfig.sourceUri}`);
  console.log(`Target: ${migrationConfig.targetUri}`);
  console.log('');

  const migrator = new MongoDBMigrator(migrationConfig);
  
  try {
    await migrator.connect();
    await migrator.migrateAll();
    await migrator.verifyMigration();
    migrator.printSummary();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrator.disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  main();
}

export { MongoDBMigrator };
export type { MigrationConfig, MigrationResult };
