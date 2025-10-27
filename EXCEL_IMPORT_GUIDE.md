# Excel Import Kullanım Kılavuzu

Oruba Contacts backend projesine Excel dosyasından toplu veri aktarma işlemi için rehber.

## Hızlı Başlangıç

### 1. Şablon Oluşturma

Önce örnek bir Excel şablon dosyası oluşturun:

```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run create:template
```

Bu komut `/Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts-template.xlsx` dosyasını oluşturur.

### 2. Excel Dosyasını Hazırlama

1. Oluşturulan şablon dosyasını açın
2. Örnek verileri silin (veya üzerine yazın)
3. Kendi verilerinizi ekleyin
4. Dosyayı `orubacontacts.xlsx` adıyla kaydedin
5. Dosyanın `/Users/fatihalkan/Documents/GitHub/orubacontacts/` dizininde olduğundan emin olun

### 3. Verileri İçe Aktarma

```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run import:excel
```

## Excel Dosyası Formatı

### Sütun Yapısı

Excel dosyanızın ilk satırı (başlık satırı) **tam olarak** şu sütunları içermelidir:

```
Hastane Adı | İl | Hastane Türü | Alt Tür | Telefon Doktor | Telefon Satınalma | Telefon Biyomedikal | Mail Doktor | Mail Satınalma | Mail Biyomedikal
```

### Sütun Açıklamaları

| Sütun | Zorunlu | Açıklama | Örnek |
|-------|---------|----------|-------|
| **Hastane Adı** | ✅ Evet | Hastane/kurum adı (benzersiz olmalı) | Ankara Şehir Hastanesi |
| **İl** | ✅ Evet | İl adı | Ankara |
| **Hastane Türü** | ✅ Evet | `kamu`, `özel` veya `muayenehane` | kamu |
| **Alt Tür** | ⚠️ Kamu için zorunlu | `eğitim araştırma`, `devlet`, `ilçe`, `üniversite` | eğitim araştırma |
| **Telefon Doktor** | ❌ İsteğe bağlı | Telefon numarası | 0312 XXX XX XX |
| **Telefon Satınalma** | ❌ İsteğe bağlı | Telefon numarası | 0312 XXX XX XX |
| **Telefon Biyomedikal** | ❌ İsteğe bağlı | Telefon numarası | 0312 XXX XX XX |
| **Mail Doktor** | ❌ İsteğe bağlı | Email adresi | doktor@hastane.gov.tr |
| **Mail Satınalma** | ❌ İsteğe bağlı | Email adresi | satinalma@hastane.gov.tr |
| **Mail Biyomedikal** | ❌ İsteğe bağlı | Email adresi | biyomedikal@hastane.gov.tr |

### Veri Kuralları

#### Hastane Türü
Sadece şu değerlerden biri olabilir (küçük-büyük harf duyarsız):
- `kamu`
- `özel`
- `muayenehane`

#### Alt Tür
**Sadece kamu hastaneleri için gereklidir**. Özel ve muayenehane için boş bırakılabilir:
- `eğitim araştırma`
- `devlet`
- `ilçe`
- `üniversite`

#### Email Adresleri
Geçerli email formatında olmalıdır:
- ✅ Doğru: `doktor@hastane.com.tr`
- ❌ Yanlış: `doktor@hastane`, `doktor.com`

#### Boş Değerler
İsteğe bağlı alanlar için boş değer kullanılabilir:
- Boş hücre
- `-` karakteri
- `N/A` yazısı

Hepsi otomatik olarak `null` değerine çevrilir.

## Örnek Excel Verileri

### Kamu Hastanesi

| Hastane Adı | İl | Hastane Türü | Alt Tür | Telefon Doktor | Mail Doktor |
|-------------|----|--------------|---------|--------------------|-------------|
| Ankara Şehir Hastanesi | Ankara | kamu | eğitim araştırma | 0312 XXX XX XX | doktor@ankara.saglik.gov.tr |

### Özel Hastane

| Hastane Adı | İl | Hastane Türü | Alt Tür | Telefon Doktor | Mail Doktor |
|-------------|----|--------------|---------|--------------------|-------------|
| Özel ABC Hastanesi | İstanbul | özel | - | 0212 XXX XX XX | bilgi@abc.com.tr |

### Muayenehane

| Hastane Adı | İl | Hastane Türü | Alt Tür | Telefon Doktor | Mail Doktor |
|-------------|----|--------------|---------|--------------------|-------------|
| Dr. Mehmet Yılmaz Muayenehanesi | Ankara | muayenehane | | 0312 XXX XX XX | mehmet.yilmaz@gmail.com |

## Komutlar

### Excel Şablonu Oluştur
```bash
npm run create:template
```

### Excel Dosyasından Veri İçe Aktar
```bash
npm run import:excel
```

### Alternatif Yöntemler

#### ts-node ile doğrudan:
```bash
npx ts-node src/scripts/importExcel.ts
```

#### Compile edip çalıştırma:
```bash
npm run build
node dist/scripts/importExcel.js
```

## İşlem Akışı

Import işlemi şu adımları takip eder:

1. **Bağlantı Kontrolü**: PostgreSQL veritabanı bağlantısı test edilir
2. **Dosya Okuma**: Excel dosyası okunur ve satırlar parse edilir
3. **Veri Dönüşümü**: Her satır Contact modeline uygun formata dönüştürülür
4. **Validasyon**: Veriler doğrulanır (zorunlu alanlar, format kontrolü vb.)
5. **Veritabanı İşlemi**: Geçerli veriler veritabanına kaydedilir (upsert)
6. **Raporlama**: İşlem sonucu detaylı rapor gösterilir

## Import Özellikleri

### Upsert Mantığı
Script, aynı "Hastane Adı" için **upsert** işlemi yapar:
- Hastane adı mevcutsa: Kayıt **güncellenir**
- Hastane adı yoksa: Yeni kayıt **eklenir**

Bu sayede:
- Aynı scripti tekrar çalıştırabilirsiniz
- Veri güncellemeleri yapabilirsiniz
- Mükerrer kayıt oluşmaz

### Hata Toleransı
- Hatalı bir satır, diğer satırların işlenmesini engellemez
- Her hata detaylı olarak loglanır
- İşlem sonunda özet rapor sunulur

### Performans
- İlerleme durumu her 10 kayıtta bir gösterilir
- Toplu işlem optimizasyonu
- Ortalama 50-100 kayıt/saniye hız

## Örnek Çıktı

```
============================================================
📊 EXCEL IMPORT İŞLEMİ BAŞLATILIYOR
============================================================

🔌 Veritabanı bağlantısı kontrol ediliyor...
✓ Veritabanı bağlantısı başarılı

📖 Excel dosyası okunuyor: /Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts.xlsx
✓ 150 satır veri okundu

🔄 Veriler işleniyor...

✓ 10/150 kayıt işlendi...
✓ 20/150 kayıt işlendi...
✓ 30/150 kayıt işlendi...
...
✓ 150/150 kayıt işlendi...

============================================================
📋 İMPORT SONUÇ RAPORU
============================================================
✓ Başarılı kayıt: 148
❌ Hatalı kayıt: 2
📊 Toplam satır: 150
⏱️  Süre: 3.45 saniye
============================================================

⚠️  HATALAR:
   - Satır 15: Geçersiz Mail Doktor formatı
   - Satır 89: Kamu hastaneleri için Alt Tür zorunludur

✅ Import işlemi tamamlandı!

🔌 Veritabanı bağlantısı kapatıldı
```

## Sorun Giderme

### Excel dosyası bulunamadı

**Hata**: `Excel dosyası bulunamadı: /Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts.xlsx`

**Çözüm**:
```bash
# Dosyanın varlığını kontrol edin
ls /Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts.xlsx

# Şablon oluşturup dosyayı kopyalayın
npm run create:template
cp /Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts-template.xlsx \
   /Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts.xlsx
```

### Veritabanı bağlantı hatası

**Hata**: `Can't reach database server`

**Çözüm**:
```bash
# PostgreSQL'in çalıştığını kontrol edin
pg_isready

# .env dosyasını kontrol edin
cat /Users/fatihalkan/Documents/GitHub/orubacontacts/backend/.env

# Veritabanını migrate edin
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run db:migrate
```

### ts-node bulunamadı

**Hata**: `ts-node: command not found`

**Çözüm**:
```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm install
```

### Prisma Client hatası

**Hata**: `@prisma/client did not initialize yet`

**Çözüm**:
```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run db:generate
```

### Sütun adı hatası

**Hata**: Excel'den veri okunmuyor veya `undefined` değerler var

**Çözüm**:
- Excel dosyasının ilk satırında (başlık satırı) sütun adlarının **tam olarak** dokümanda belirtildiği gibi olduğundan emin olun
- Boşluk, Türkçe karakter ve büyük-küçük harf uyumuna dikkat edin
- Örnek: `Hastane Adı` (doğru) vs `Hastane Adi` (yanlış)

## En İyi Uygulamalar

### 1. Veri Hazırlığı
- Excel dosyanızı hazırlamadan önce şablon dosyasını kullanın
- Tüm verileri eklemeden önce 5-10 satırlık test verisi ile deneyin
- Email adreslerini ve telefon numaralarını kontrol edin

### 2. Import Öncesi
```bash
# Veritabanı yedek alın
pg_dump -U postgres orubacontacts > backup.sql

# Test modda çalıştırın (küçük veri seti)
# İlk 10 satırı import edin ve kontrol edin
```

### 3. Import Sonrası
```bash
# Veritabanında kayıtları kontrol edin
psql -U postgres -d orubacontacts -c "SELECT COUNT(*) FROM contacts;"
psql -U postgres -d orubacontacts -c "SELECT * FROM contacts LIMIT 5;"
```

### 4. Güncelleme İşlemleri
- Mevcut verileri güncellemek için aynı Excel dosyasını düzenleyip tekrar import edebilirsiniz
- Upsert mantığı sayesinde mükerrer kayıt oluşmaz

## İleri Seviye Kullanım

### Transaction İle Import
Production ortamında daha güvenli import için transaction wrapper ekleyin:

```typescript
await prisma.$transaction(async (tx) => {
  for (const contact of contacts) {
    await tx.contact.upsert({...});
  }
});
```

### Batch Import
Çok büyük dosyalar için batch processing:

```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
  const batch = contacts.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(c => upsertContact(c)));
}
```

### Dry Run Mode
Test amaçlı çalıştırma (veritabanına yazmadan):

```bash
DRY_RUN=true npm run import:excel
```

## Destek

Sorun yaşarsanız:
1. Bu dokümandaki "Sorun Giderme" bölümünü kontrol edin
2. Script loglarını inceleyin
3. `/Users/fatihalkan/Documents/GitHub/orubacontacts/backend/src/scripts/README.md` dosyasına bakın

## Güncellemeler

- **v1.0.0** (2025-10-27): İlk versiyon
  - Excel import fonksiyonu
  - Şablon oluşturma
  - Validasyon ve hata yönetimi
  - Upsert desteği
