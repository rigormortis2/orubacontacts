# Oruba Contacts - Hızlı Başlangıç

## Excel Import - Hızlı Kullanım

### Adım 1: Şablon Oluştur

```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run create:template
```

Bu komut proje kök dizininde `orubacontacts-template.xlsx` dosyası oluşturur.

### Adım 2: Excel Dosyasını Hazırla

1. Şablon dosyasını açın
2. Örnek verileri düzenleyin veya silin
3. Kendi verilerinizi ekleyin
4. Dosyayı `orubacontacts.xlsx` olarak kaydedin
5. Dosyanın `/Users/fatihalkan/Documents/GitHub/orubacontacts/` dizininde olduğundan emin olun

### Adım 3: Verileri İçe Aktar

```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run import:excel
```

## Excel Dosyası Sütunları

Başlık satırı şu sütunları içermeli (tam olarak bu isimlerle):

```
Hastane Adı | İl | Hastane Türü | Alt Tür | Telefon Doktor | Telefon Satınalma | Telefon Biyomedikal | Mail Doktor | Mail Satınalma | Mail Biyomedikal
```

### Zorunlu Alanlar
- ✅ **Hastane Adı**: Benzersiz olmalı
- ✅ **İl**: İl adı
- ✅ **Hastane Türü**: `kamu`, `özel` veya `muayenehane`
- ⚠️ **Alt Tür**: Sadece kamu hastaneleri için zorunlu

### İsteğe Bağlı Alanlar
- Telefon Doktor
- Telefon Satınalma
- Telefon Biyomedikal
- Mail Doktor
- Mail Satınalma
- Mail Biyomedikal

## Örnek Veri

### Kamu Hastanesi
```
Hastane Adı: Ankara Şehir Hastanesi
İl: Ankara
Hastane Türü: kamu
Alt Tür: eğitim araştırma
Telefon Doktor: 0312 XXX XX XX
Mail Doktor: doktor@ankara.saglik.gov.tr
```

### Özel Hastane
```
Hastane Adı: Özel ABC Hastanesi
İl: İstanbul
Hastane Türü: özel
Alt Tür: (boş bırakılabilir)
Telefon Doktor: 0212 XXX XX XX
Mail Doktor: bilgi@abc.com.tr
```

## Önemli Notlar

1. **Hastane Türü** değerleri: `kamu`, `özel`, `muayenehane` (küçük-büyük harf duyarsız)
2. **Alt Tür** değerleri (sadece kamu için): `eğitim araştırma`, `devlet`, `ilçe`, `üniversite`
3. **Email adresleri** geçerli formatta olmalı
4. **Boş değerler** için `-`, `N/A` veya boş hücre kullanabilirsiniz
5. **Aynı hastane** tekrar import edilirse güncellenir (mükerrer kayıt oluşmaz)

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run create:template` | Excel şablon dosyası oluşturur |
| `npm run import:excel` | Excel dosyasından veri içe aktarır |
| `npm run dev` | Backend sunucusunu başlatır |
| `npm run db:migrate` | Veritabanı migrasyonlarını çalıştırır |
| `npm run db:generate` | Prisma Client'ı günceller |

## Sorun Giderme

### Dosya bulunamadı hatası
```bash
# Dosyanın var olduğunu kontrol edin
ls /Users/fatihalkan/Documents/GitHub/orubacontacts/orubacontacts.xlsx
```

### Veritabanı bağlantı hatası
```bash
# .env dosyasını oluşturun
cp /Users/fatihalkan/Documents/GitHub/orubacontacts/backend/.env.example \
   /Users/fatihalkan/Documents/GitHub/orubacontacts/backend/.env

# Veritabanını migrate edin
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm run db:generate
npm run db:migrate
```

### Bağımlılıklar eksik
```bash
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend
npm install
```

## Detaylı Dokümantasyon

Daha fazla bilgi için:
- **Import Detayları**: `/Users/fatihalkan/Documents/GitHub/orubacontacts/backend/src/scripts/README.md`
- **Kapsamlı Kılavuz**: `/Users/fatihalkan/Documents/GitHub/orubacontacts/EXCEL_IMPORT_GUIDE.md`

## İlk Kurulum

Eğer projeyi ilk kez kuruyorsanız:

```bash
# 1. Backend dizinine gidin
cd /Users/fatihalkan/Documents/GitHub/orubacontacts/backend

# 2. Bağımlılıkları yükleyin
npm install

# 3. .env dosyasını oluşturun
cp .env.example .env
# .env dosyasını düzenleyip DATABASE_URL'i ayarlayın

# 4. Veritabanını hazırlayın
npm run db:generate
npm run db:migrate

# 5. Şablon oluşturun
npm run create:template

# 6. Excel dosyasını hazırlayın ve import edin
npm run import:excel

# 7. Backend'i başlatın
npm run dev
```

Backend `http://localhost:3000` adresinde çalışacaktır.
