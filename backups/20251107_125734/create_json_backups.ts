import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BackupMetadata {
  tableName: string;
  recordCount: number;
  timestamp: string;
  filePath: string;
  fileSize?: number;
}

interface BackupSummary {
  backupTimestamp: string;
  databaseVersion: string;
  tables: BackupMetadata[];
  totalRecords: number;
  totalSize: number;
}

async function getDatabaseVersion(): Promise<string> {
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    return result[0]?.version || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

async function backupTable<T>(
  tableName: string,
  fetchData: () => Promise<T[]>,
  backupDir: string
): Promise<BackupMetadata> {
  console.log(`\n📦 Backing up ${tableName}...`);

  try {
    // Fetch all records
    const records = await fetchData();
    const recordCount = records.length;

    console.log(`   Found ${recordCount} records`);

    // Create backup object with metadata
    const backup = {
      metadata: {
        tableName,
        recordCount,
        timestamp: new Date().toISOString(),
        backupVersion: '1.0.0'
      },
      data: records
    };

    // Write to file
    const fileName = `${tableName}_backup.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8');

    const fileSize = await getFileSize(filePath);
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    console.log(`   ✅ Saved to ${fileName} (${fileSizeMB} MB)`);

    return {
      tableName,
      recordCount,
      timestamp: backup.metadata.timestamp,
      filePath,
      fileSize
    };
  } catch (error) {
    console.error(`   ❌ Error backing up ${tableName}:`, error);
    throw error;
  }
}

async function createBackups() {
  const backupDir = '/Users/fatihalkan/Documents/GitHub/orubacontacts/backups/20251107_125734';
  const backupMetadata: BackupMetadata[] = [];

  console.log('🚀 Starting comprehensive database backup...');
  console.log(`📁 Backup directory: ${backupDir}\n`);

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();

  try {
    // 1. Backup odoo_contacts
    backupMetadata.push(
      await backupTable(
        'odoo_contacts',
        () => prisma.odooContact.findMany({
          include: {
            matchedHospital: {
              include: {
                city: true,
                type: true,
                subtype: true
              }
            }
          }
        }),
        backupDir
      )
    );

    // 2. Backup hospitals
    backupMetadata.push(
      await backupTable(
        'hospitals',
        () => prisma.hospitalReference.findMany({
          include: {
            city: true,
            type: true,
            subtype: true,
            contacts: true,
            personContacts: true,
            contactPersons: true,
            odooContacts: true
          }
        }),
        backupDir
      )
    );

    // 3. Backup trello_matches
    backupMetadata.push(
      await backupTable(
        'trello_matches',
        () => prisma.trelloMatches.findMany({
          include: {
            hospital: {
              include: {
                city: true,
                type: true,
                subtype: true
              }
            }
          }
        }),
        backupDir
      )
    );

    // 4. Backup contacts
    backupMetadata.push(
      await backupTable(
        'contacts',
        () => prisma.contact.findMany({
          include: {
            jobTitle: true,
            hospital: {
              include: {
                city: true,
                type: true,
                subtype: true
              }
            }
          }
        }),
        backupDir
      )
    );

    // 5. Backup person_contacts
    backupMetadata.push(
      await backupTable(
        'person_contacts',
        () => prisma.personContact.findMany({
          include: {
            jobTitle: true,
            hospital: {
              include: {
                city: true,
                type: true,
                subtype: true
              }
            }
          }
        }),
        backupDir
      )
    );

    // 6. Backup cities
    backupMetadata.push(
      await backupTable(
        'cities',
        () => prisma.city.findMany({
          include: {
            hospitals: true
          }
        }),
        backupDir
      )
    );

    // 7. Backup job_titles
    backupMetadata.push(
      await backupTable(
        'job_titles',
        () => prisma.jobTitle.findMany({
          include: {
            personContacts: true,
            contactPersons: true
          }
        }),
        backupDir
      )
    );

    // 8. Backup hospital_types
    backupMetadata.push(
      await backupTable(
        'hospital_types',
        () => prisma.hospitalType.findMany({
          include: {
            subtypes: true,
            hospitals: true
          }
        }),
        backupDir
      )
    );

    // 9. Backup hospital_subtypes
    backupMetadata.push(
      await backupTable(
        'hospital_subtypes',
        () => prisma.hospitalSubtype.findMany({
          include: {
            parentType: true,
            hospitals: true
          }
        }),
        backupDir
      )
    );

    // 10. Backup trello_raw_datas
    backupMetadata.push(
      await backupTable(
        'trello_raw_datas',
        () => prisma.rawData.findMany(),
        backupDir
      )
    );

    // Get database version
    const dbVersion = await getDatabaseVersion();

    // Calculate totals
    const totalRecords = backupMetadata.reduce((sum, meta) => sum + meta.recordCount, 0);
    const totalSize = backupMetadata.reduce((sum, meta) => sum + (meta.fileSize || 0), 0);

    // Create summary
    const summary: BackupSummary = {
      backupTimestamp: timestamp,
      databaseVersion: dbVersion,
      tables: backupMetadata,
      totalRecords,
      totalSize
    };

    // Write summary file
    const summaryPath = path.join(backupDir, 'backup_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ BACKUP COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Database Version: ${dbVersion.split('\n')[0]}`);
    console.log(`   Total Tables: ${backupMetadata.length}`);
    console.log(`   Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`   Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n📋 Table Details:');

    backupMetadata.forEach((meta) => {
      const sizeMB = ((meta.fileSize || 0) / 1024 / 1024).toFixed(2);
      console.log(`   - ${meta.tableName.padEnd(25)} : ${String(meta.recordCount).padStart(6)} records (${sizeMB} MB)`);
    });

    console.log(`\n📁 Backup location: ${backupDir}`);
    console.log(`📄 Summary file: backup_summary.json\n`);

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backup
createBackups()
  .then(() => {
    console.log('🎉 Backup process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Backup process failed:', error);
    process.exit(1);
  });
