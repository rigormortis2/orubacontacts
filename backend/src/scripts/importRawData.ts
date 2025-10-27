import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExcelRow {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  title: string;
  description?: string;
  list_name: string;
  short_url?: string;
  full_url?: string;
}

interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

async function importRawData(): Promise<ImportStats> {
  const stats: ImportStats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const startTime = Date.now();

  try {
    console.log('============================================================');
    console.log('📊 EXCEL IMPORT İŞLEMİ BAŞLATILIYOR');
    console.log('============================================================\n');

    // Excel dosyasını oku
    const excelPath = path.resolve('/app/oruba_contacts_raw_data.xlsx');
    console.log('📁 Excel dosyası okunuyor:', excelPath);

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

    stats.total = data.length;
    console.log(`✓ ${stats.total} satır veri okundu\n`);
    console.log('🔄 Veriler işleniyor...\n');

    // Her satırı işle
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Zorunlu alanları kontrol et
        if (!row.title || !row.list_name) {
          throw new Error(`Title veya ListName boş`);
        }

        // Duplicate kontrolü (title + listName kombinasyonu)
        const existing = await prisma.rawData.findFirst({
          where: {
            title: row.title.trim(),
            listName: row.list_name.trim(),
          },
        });

        if (existing) {
          stats.skipped++;
          continue;
        }

        // Database'e kaydet
        await prisma.rawData.create({
          data: {
            title: row.title.trim(),
            description: row.description?.trim() || null,
            listName: row.list_name.trim(),
            shortUrl: row.short_url?.trim() || null,
            fullUrl: row.full_url?.trim() || null,
          },
        });

        stats.successful++;

        // İlerleme göstergesi (her 50 kayıtta)
        if (stats.successful % 50 === 0) {
          console.log(`✓ ${stats.successful}/${stats.total} kayıt işlendi...`);
        }
      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errors.push({
          row: rowNumber,
          error: errorMessage,
        });

        if (stats.failed <= 5) {
          console.error(`❌ Satır ${rowNumber} hatası: ${errorMessage}`);
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    // Özet rapor
    console.log('\n============================================================');
    console.log('📋 İMPORT SONUÇ RAPORU');
    console.log('============================================================');
    console.log(`✓ Başarılı kayıt: ${stats.successful}`);
    console.log(`⏭️  Atlanan kayıt: ${stats.skipped} (duplicate)`);
    console.log(`❌ Hatalı kayıt: ${stats.failed}`);
    console.log(`📊 Toplam satır: ${stats.total}`);
    console.log(`⏱️  Süre: ${duration.toFixed(2)} saniye`);
    console.log(`⚡ Hız: ${(stats.successful / duration).toFixed(1)} kayıt/sn`);
    console.log('============================================================\n');

    if (stats.errors.length > 0 && stats.errors.length <= 10) {
      console.log('❌ Hatalar:');
      stats.errors.forEach((err) => {
        console.log(`  Satır ${err.row}: ${err.error}`);
      });
      console.log('');
    }

    if (stats.successful > 0) {
      console.log('✅ Import işlemi tamamlandı!');
    } else {
      console.log('⚠️  Hiç kayıt eklenmedi!');
    }

    return stats;
  } catch (error) {
    console.error('\n❌ Fatal hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  importRawData()
    .then((stats) => {
      process.exit(stats.failed > 0 ? 1 : 0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { importRawData };
