import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface ExcelRow {
  'Hastane Adı': string;
  'İl': string;
  'Hastane Türü': string;
  'Alt Tür': string;
  'Telefon Doktor': string;
  'Telefon Satınalma': string;
  'Telefon Biyomedikal': string;
  'Mail Doktor': string;
  'Mail Satınalma': string;
  'Mail Biyomedikal': string;
}

interface ContactData {
  hastaneAdi: string;
  il: string;
  hastaneTuru: string;
  altTur: string | null;
  telefonDoktor: string | null;
  telefonSatinalma: string | null;
  telefonBiyomedikal: string | null;
  mailDoktor: string | null;
  mailSatinalma: string | null;
  mailBiyomedikal: string | null;
}

/**
 * Excel dosyasından verileri okur
 */
function readExcelFile(filePath: string): ExcelRow[] {
  console.log(`\n📖 Excel dosyası okunuyor: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel dosyası bulunamadı: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✓ ${data.length} satır veri okundu`);
  return data;
}

/**
 * Excel satırını Contact modelinin formatına dönüştürür
 */
function transformRowToContact(row: ExcelRow): ContactData {
  // Boş string değerlerini null'a çevir
  const cleanValue = (value: any): string | null => {
    if (!value || value === '' || value === '-' || value === 'N/A') {
      return null;
    }
    return String(value).trim();
  };

  return {
    hastaneAdi: String(row['Hastane Adı']).trim(),
    il: String(row['İl']).trim(),
    hastaneTuru: String(row['Hastane Türü']).trim().toLowerCase(),
    altTur: cleanValue(row['Alt Tür']),
    telefonDoktor: cleanValue(row['Telefon Doktor']),
    telefonSatinalma: cleanValue(row['Telefon Satınalma']),
    telefonBiyomedikal: cleanValue(row['Telefon Biyomedikal']),
    mailDoktor: cleanValue(row['Mail Doktor']),
    mailSatinalma: cleanValue(row['Mail Satınalma']),
    mailBiyomedikal: cleanValue(row['Mail Biyomedikal']),
  };
}

/**
 * Veriyi doğrular
 */
function validateContact(contact: ContactData, rowIndex: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Zorunlu alanları kontrol et
  if (!contact.hastaneAdi) {
    errors.push(`Satır ${rowIndex}: Hastane Adı zorunludur`);
  }

  if (!contact.il) {
    errors.push(`Satır ${rowIndex}: İl zorunludur`);
  }

  if (!contact.hastaneTuru) {
    errors.push(`Satır ${rowIndex}: Hastane Türü zorunludur`);
  }

  // Hastane türünü kontrol et
  const validTypes = ['kamu', 'özel', 'muayenehane'];
  if (contact.hastaneTuru && !validTypes.includes(contact.hastaneTuru)) {
    errors.push(`Satır ${rowIndex}: Geçersiz hastane türü '${contact.hastaneTuru}'. Geçerli değerler: ${validTypes.join(', ')}`);
  }

  // Alt tür sadece kamu hastaneleri için zorunlu
  if (contact.hastaneTuru === 'kamu' && !contact.altTur) {
    errors.push(`Satır ${rowIndex}: Kamu hastaneleri için Alt Tür zorunludur`);
  }

  // Email formatını kontrol et (varsa)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (contact.mailDoktor && !emailRegex.test(contact.mailDoktor)) {
    errors.push(`Satır ${rowIndex}: Geçersiz Mail Doktor formatı`);
  }
  if (contact.mailSatinalma && !emailRegex.test(contact.mailSatinalma)) {
    errors.push(`Satır ${rowIndex}: Geçersiz Mail Satınalma formatı`);
  }
  if (contact.mailBiyomedikal && !emailRegex.test(contact.mailBiyomedikal)) {
    errors.push(`Satır ${rowIndex}: Geçersiz Mail Biyomedikal formatı`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Kontağı veritabanına ekler veya günceller
 */
async function upsertContact(contact: ContactData): Promise<void> {
  await prisma.trelloMatches.upsert({
    where: {
      hastaneAdi: contact.hastaneAdi
    },
    update: {
      il: contact.il,
      hastaneTuru: contact.hastaneTuru,
      altTur: contact.altTur,
      telefonDoktor: contact.telefonDoktor,
      telefonSatinalma: contact.telefonSatinalma,
      telefonBiyomedikal: contact.telefonBiyomedikal,
      mailDoktor: contact.mailDoktor,
      mailSatinalma: contact.mailSatinalma,
      mailBiyomedikal: contact.mailBiyomedikal,
      updatedAt: new Date()
    },
    create: contact
  });
}

/**
 * Ana import fonksiyonu
 */
async function importExcelData(): Promise<void> {
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    console.log('='.repeat(60));
    console.log('📊 EXCEL IMPORT İŞLEMİ BAŞLATILIYOR');
    console.log('='.repeat(60));

    // Excel dosyasının yolu (root dizinde)
    const excelFilePath = path.join(__dirname, '../../../orubacontacts.xlsx');

    // Veritabanı bağlantısını test et
    console.log('\n🔌 Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('✓ Veritabanı bağlantısı başarılı');

    // Excel dosyasını oku
    const rows = readExcelFile(excelFilePath);

    if (rows.length === 0) {
      console.log('\n⚠️  Excel dosyası boş!');
      return;
    }

    console.log('\n🔄 Veriler işleniyor...\n');

    // Her satırı işle
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // Excel'de başlık 1. satır, veri 2. satırdan başlar
      const row = rows[i];

      try {
        // Veriyi dönüştür
        const contact = transformRowToContact(row);

        // Veriyi doğrula
        const validation = validateContact(contact, rowNumber);

        if (!validation.valid) {
          errors.push(...validation.errors);
          errorCount++;
          console.log(`❌ Satır ${rowNumber}: ${contact.hastaneAdi || 'Bilinmeyen'} - Doğrulama hatası`);
          continue;
        }

        // Veritabanına kaydet
        await upsertContact(contact);
        successCount++;

        // İlerleme göster (her 10 kayıtta bir)
        if (successCount % 10 === 0) {
          console.log(`✓ ${successCount}/${rows.length} kayıt işlendi...`);
        }

      } catch (error: any) {
        errorCount++;
        const errorMsg = `Satır ${rowNumber}: ${error.message}`;
        errors.push(errorMsg);
        console.log(`❌ ${errorMsg}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Özet rapor
    console.log('\n' + '='.repeat(60));
    console.log('📋 İMPORT SONUÇ RAPORU');
    console.log('='.repeat(60));
    console.log(`✓ Başarılı kayıt: ${successCount}`);
    console.log(`❌ Hatalı kayıt: ${errorCount}`);
    console.log(`📊 Toplam satır: ${rows.length}`);
    console.log(`⏱️  Süre: ${duration} saniye`);
    console.log('='.repeat(60));

    // Hataları göster
    if (errors.length > 0) {
      console.log('\n⚠️  HATALAR:');
      errors.slice(0, 20).forEach(error => console.log(`   - ${error}`));
      if (errors.length > 20) {
        console.log(`   ... ve ${errors.length - 20} hata daha`);
      }
    }

    if (successCount > 0) {
      console.log('\n✅ Import işlemi tamamlandı!');
    } else {
      console.log('\n⚠️  Hiçbir kayıt eklenemedi!');
    }

  } catch (error: any) {
    console.error('\n💥 Kritik hata:', error.message);
    throw error;
  } finally {
    // Veritabanı bağlantısını kapat
    await prisma.$disconnect();
    console.log('\n🔌 Veritabanı bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  importExcelData()
    .catch((error) => {
      console.error('\n💥 HATA:', error);
      process.exit(1);
    });
}

export { importExcelData };
