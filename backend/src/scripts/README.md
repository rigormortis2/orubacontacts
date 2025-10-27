# Excel Import Script

Bu script, Excel dosyasından hastane/kurum iletişim bilgilerini okuyup PostgreSQL veritabanına aktarır.

## Gereksinimler

- Node.js 18+
- PostgreSQL veritabanı
- xlsx kütüphanesi (package.json'da mevcut)

## Kurulum

1. Bağımlılıkları yükleyin (henüz yapmadıysanız):
```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm install
```

2. Veritabanını hazırlayın:
```bash
npm run db:generate
npm run db:migrate
```

3. `.env` dosyasını oluşturun ve veritabanı bağlantı bilgilerini ekleyin:
```bash
cp .env.example .env
# .env dosyasını düzenleyip DATABASE_URL'i ayarlayın
```

## Excel Dosyası Formatı

Excel dosyası (`orubacontacts.xlsx`) proje kök dizinine yerleştirilmelidir:
```
/Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts.xlsx
```

### Gerekli Sütunlar

Excel dosyasının ilk satırı başlık satırı olmalı ve şu sütunları içermelidir:

| Sütun Adı | Zorunlu | Açıklama |
|-----------|---------|----------|
| Hastane Adı | ✅ | Hastane/kurum adı (unique) |
| İl | ✅ | İl adı |
| Hastane Türü | ✅ | `kamu`, `özel` veya `muayenehane` |
| Alt Tür | ⚠️ | Kamu için zorunlu: `eğitim araştırma`, `devlet`, `ilçe`, `üniversite` |
| Telefon Doktor | ❌ | Doktor telefon numarası |
| Telefon Satınalma | ❌ | Satınalma birimi telefonu |
| Telefon Biyomedikal | ❌ | Biyomedikal birimi telefonu |
| Mail Doktor | ❌ | Doktor email adresi |
| Mail Satınalma | ❌ | Satınalma birimi email |
| Mail Biyomedikal | ❌ | Biyomedikal birimi email |

### Örnek Excel Verisi

| Hastane Adı | İl | Hastane Türü | Alt Tür | Telefon Doktor | Mail Doktor |
|-------------|----|--------------|---------|--------------------|-------------|
| Ankara Şehir Hastanesi | Ankara | kamu | eğitim araştırma | 0312 XXX XX XX | doktor@ankara.saglik.gov.tr |
| Özel ABC Hastanesi | İstanbul | özel | - | 0212 XXX XX XX | bilgi@abc.com.tr |

## Kullanım

### Yöntem 1: npm script ile

```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run import:excel
```

### Yöntem 2: ts-node ile doğrudan

```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npx ts-node src/scripts/importExcel.ts
```

### Yöntem 3: Compile edip çalıştırma

```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run build
node dist/scripts/importExcel.js
```

## Script Özellikleri

### Veri Doğrulama

- Zorunlu alanların kontrolü
- Hastane türü validasyonu (kamu, özel, muayenehane)
- Email format kontrolü
- Kamu hastaneleri için alt tür kontrolü

### Hata Yönetimi

- Detaylı hata mesajları
- Satır bazında hata raporlama
- Hatalı kayıtlar atlanır, diğer kayıtlar işlenir
- İşlem sonunda özet rapor

### Özellikler

- **Upsert**: Aynı hastane adı varsa günceller, yoksa yeni kayıt ekler
- **İlerleme göstergesi**: Her 10 kayıtta bir ilerleme bilgisi
- **Performans**: Toplu işlem desteği
- **Loglama**: Detaylı console çıktıları

## Çıktı Örneği

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

✅ Import işlemi tamamlandı!

🔌 Veritabanı bağlantısı kapatıldı
```

## Hata Çözümleri

### "Excel dosyası bulunamadı"
Excel dosyasının doğru konumda olduğundan emin olun:
```bash
ls /Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts.xlsx
```

### "Veritabanı bağlantı hatası"
- `.env` dosyasında `DATABASE_URL` kontrol edin
- PostgreSQL servisinin çalıştığından emin olun
- Veritabanı migrasyonlarının yapıldığını kontrol edin: `npm run db:migrate`

### "ts-node bulunamadı"
```bash
npm install
```

### "Prisma Client bulunamadı"
```bash
npm run db:generate
```

## Notlar

- Script aynı hastane adı için upsert yapar (varsa günceller, yoksa ekler)
- Boş değerler (`-`, `N/A`, boş string) otomatik olarak `null`'a çevrilir
- Email adresleri basit regex ile validate edilir
- Hastane türleri küçük harfe çevrilir (case-insensitive)

## Güvenlik

- Script sadece local development için tasarlanmıştır
- Production ortamında kullanmadan önce:
  - Rate limiting ekleyin
  - Transaction wrapping yapın
  - Daha detaylı validasyon ekleyin
  - Rollback mekanizması ekleyin
