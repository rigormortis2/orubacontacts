import * as XLSX from 'xlsx';
import * as path from 'path';

/**
 * Excel şablon dosyası oluşturur
 */
function createExcelTemplate(): void {
  console.log('📝 Excel şablon dosyası oluşturuluyor...\n');

  // Örnek veriler
  const data = [
    {
      'Hastane Adı': 'Ankara Şehir Hastanesi',
      'İl': 'Ankara',
      'Hastane Türü': 'kamu',
      'Alt Tür': 'eğitim araştırma',
      'Telefon Doktor': '0312 XXX XX XX',
      'Telefon Satınalma': '0312 XXX XX XX',
      'Telefon Biyomedikal': '0312 XXX XX XX',
      'Mail Doktor': 'doktor@ankara.saglik.gov.tr',
      'Mail Satınalma': 'satinalma@ankara.saglik.gov.tr',
      'Mail Biyomedikal': 'biyomedikal@ankara.saglik.gov.tr',
    },
    {
      'Hastane Adı': 'İstanbul Eğitim ve Araştırma Hastanesi',
      'İl': 'İstanbul',
      'Hastane Türü': 'kamu',
      'Alt Tür': 'eğitim araştırma',
      'Telefon Doktor': '0212 XXX XX XX',
      'Telefon Satınalma': '0212 XXX XX XX',
      'Telefon Biyomedikal': '0212 XXX XX XX',
      'Mail Doktor': 'doktor@istanbul.saglik.gov.tr',
      'Mail Satınalma': 'satinalma@istanbul.saglik.gov.tr',
      'Mail Biyomedikal': 'biyomedikal@istanbul.saglik.gov.tr',
    },
    {
      'Hastane Adı': 'Özel ABC Hastanesi',
      'İl': 'İstanbul',
      'Hastane Türü': 'özel',
      'Alt Tür': '',
      'Telefon Doktor': '0212 XXX XX XX',
      'Telefon Satınalma': '0212 XXX XX XX',
      'Telefon Biyomedikal': '0212 XXX XX XX',
      'Mail Doktor': 'doktor@abc.com.tr',
      'Mail Satınalma': 'satinalma@abc.com.tr',
      'Mail Biyomedikal': 'biyomedikal@abc.com.tr',
    },
    {
      'Hastane Adı': 'Dr. Mehmet Yılmaz Muayenehanesi',
      'İl': 'Ankara',
      'Hastane Türü': 'muayenehane',
      'Alt Tür': '',
      'Telefon Doktor': '0312 XXX XX XX',
      'Telefon Satınalma': '',
      'Telefon Biyomedikal': '',
      'Mail Doktor': 'mehmet.yilmaz@gmail.com',
      'Mail Satınalma': '',
      'Mail Biyomedikal': '',
    },
    {
      'Hastane Adı': 'İzmir Devlet Hastanesi',
      'İl': 'İzmir',
      'Hastane Türü': 'kamu',
      'Alt Tür': 'devlet',
      'Telefon Doktor': '0232 XXX XX XX',
      'Telefon Satınalma': '0232 XXX XX XX',
      'Telefon Biyomedikal': '0232 XXX XX XX',
      'Mail Doktor': 'doktor@izmir.saglik.gov.tr',
      'Mail Satınalma': 'satinalma@izmir.saglik.gov.tr',
      'Mail Biyomedikal': 'biyomedikal@izmir.saglik.gov.tr',
    }
  ];

  // Worksheet oluştur
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Sütun genişliklerini ayarla
  const columnWidths = [
    { wch: 35 }, // Hastane Adı
    { wch: 15 }, // İl
    { wch: 15 }, // Hastane Türü
    { wch: 20 }, // Alt Tür
    { wch: 18 }, // Telefon Doktor
    { wch: 20 }, // Telefon Satınalma
    { wch: 22 }, // Telefon Biyomedikal
    { wch: 30 }, // Mail Doktor
    { wch: 30 }, // Mail Satınalma
    { wch: 30 }, // Mail Biyomedikal
  ];
  worksheet['!cols'] = columnWidths;

  // Workbook oluştur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hastaneler');

  // Dosya yolu
  const outputPath = path.join(__dirname, '../../../orubacontacts-template.xlsx');

  // Dosyayı kaydet
  XLSX.writeFile(workbook, outputPath);

  console.log('✅ Excel şablon dosyası oluşturuldu!');
  console.log(`📁 Dosya yolu: ${outputPath}`);
  console.log('\n📋 Şablon bilgileri:');
  console.log('   - 5 örnek kayıt içerir');
  console.log('   - Tüm sütunlar dahil');
  console.log('   - Farklı hastane türleri gösterilmiştir');
  console.log('\n💡 Kullanım:');
  console.log('   1. Bu dosyayı "orubacontacts.xlsx" olarak kaydedin');
  console.log('   2. Örnek verileri silin ve kendi verilerinizi ekleyin');
  console.log('   3. npm run import:excel komutu ile import edin');
}

// Script'i çalıştır
if (require.main === module) {
  createExcelTemplate();
}

export { createExcelTemplate };
