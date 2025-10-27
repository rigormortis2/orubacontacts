const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.resolve(__dirname, '../../../oruba_contacts_raw_data.xlsx');

console.log('📊 Excel Analizi\n');
console.log('Dosya:', excelPath, '\n');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log('Sheet Adı:', sheetName);
  console.log('Toplam Satır:', data.length);
  console.log('\nSütunlar:', Object.keys(data[0] || {}).join(', '));

  console.log('\n📋 İlk 3 Satır:\n');
  data.slice(0, 3).forEach((row, idx) => {
    console.log(`--- Satır ${idx + 1} ---`);
    Object.entries(row).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  });

  console.log('✅ Analiz tamamlandı!');
} catch (error) {
  console.error('❌ Hata:', error.message);
}
