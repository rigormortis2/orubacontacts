# Oruba Contacts - Hastane İletişim Yönetim Sistemi

Oruba Contacts, hastane iletişim bilgilerini yönetmek için geliştirilmiş modern bir web uygulamasıdır. Hastanelerin telefon, e-posta ve diğer iletişim bilgilerini merkezi bir platformda saklamanıza, Excel'den toplu veri yüklemenize ve kolayca aramanıza olanak tanır.

## Özellikler

- Hastane iletişim bilgilerinin merkezi yönetimi
- Excel dosyalarından toplu veri içe aktarma
- Gelişmiş arama ve filtreleme
- İl, hastane türü ve alt türe göre kategorize etme
- Doktor, satınalma ve biyomedikal departmanları için ayrı iletişim bilgileri
- Modern ve kullanıcı dostu arayüz
- RESTful API altyapısı
- Docker ile kolay kurulum ve deployment

## Teknoloji Stack

### Backend
- **Node.js** - Runtime ortamı
- **Express.js** - Web framework
- **TypeScript** - Type-safe geliştirme
- **Prisma ORM** - Veritabanı yönetimi
- **PostgreSQL** - İlişkisel veritabanı
- **XLSX** - Excel dosya işleme

### Frontend
- **React** - UI framework
- **TypeScript** - Type-safe geliştirme
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### DevOps
- **Docker** - Konteynerizasyon
- **Docker Compose** - Multi-container orkestrasyon
- **Nginx** - Web server (frontend)
- **Multi-stage builds** - Optimize edilmiş image'lar

## Hızlı Başlangıç (Docker ile)

### Gereksinimler
- Docker (v20.10+)
- Docker Compose (v2.0+)

### Kurulum Adımları

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd orubacontacts
```

2. **Docker container'ları başlatın**
```bash
# Tüm servisleri build edin ve başlatın
docker-compose up -d

# Log'ları takip edin (opsiyonel)
docker-compose logs -f
```

3. **Uygulamaya erişin**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Database: localhost:5432

### Container'ları Yönetme

```bash
# Container'ları durdur
docker-compose down

# Container'ları durdur ve volume'leri temizle (VERİTABANI SİLİNİR!)
docker-compose down -v

# Sadece belirli bir servisi yeniden başlat
docker-compose restart backend

# Belirli bir servisi yeniden build et
docker-compose up -d --build backend

# Container'ların durumunu kontrol et
docker-compose ps

# Container log'larını görüntüle
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

## Excel'den Veri İçe Aktarma

### Excel Dosya Formatı

Excel dosyanız aşağıdaki sütunlara sahip olmalıdır:

| Sütun Adı | Açıklama | Zorunlu |
|-----------|----------|---------|
| Hastane Adı | Hastanenin tam adı | Evet |
| İl | Hastanenin bulunduğu il | Evet |
| Hastane Türü | kamu, özel, muayenehane | Evet |
| Alt Tür | eğitim araştırma, devlet, ilçe, üniversite | Hayır |
| Telefon - Doktor | Doktor iletişim telefonu | Hayır |
| Telefon - Satınalma | Satınalma departmanı telefonu | Hayır |
| Telefon - Biyomedikal | Biyomedikal departmanı telefonu | Hayır |
| Mail - Doktor | Doktor e-posta adresi | Hayır |
| Mail - Satınalma | Satınalma departmanı e-postası | Hayır |
| Mail - Biyomedikal | Biyomedikal departmanı e-postası | Hayır |

### İçe Aktarma Yöntemi 1: Frontend Üzerinden (Geliştirilecek)

Frontend arayüzünde "İçe Aktar" butonunu kullanarak Excel dosyanızı yükleyin.

### İçe Aktarma Yöntemi 2: Docker Container İçinde

```bash
# 1. Excel dosyanızı backend/imports klasörüne kopyalayın
mkdir -p backend/imports
cp /path/to/your/excel-file.xlsx backend/imports/

# 2. Backend container'ına bağlanın
docker exec -it orubacontacts-backend sh

# 3. Import script'ini çalıştırın
npm run import:excel /app/imports/excel-file.xlsx

# 4. Container'dan çıkın
exit
```

### İçe Aktarma Yöntemi 3: API Endpoint (Önerilir)

```bash
# Curl ile Excel dosyası yükleme
curl -X POST http://localhost:3000/api/contacts/import \
  -F "file=@/path/to/your/excel-file.xlsx"
```

## API Endpoints

### Sağlık Kontrolü
```
GET /health
Response: { "status": "ok", "message": "Oruba Contacts API is running" }
```

### Tüm Kişileri Listele
```
GET /api/contacts
Query Parameters:
  - page: Sayfa numarası (default: 1)
  - limit: Sayfa başına kayıt (default: 50)
  - search: Arama terimi
  - il: İl filtreleme
  - hastaneTuru: Hastane türü filtreleme (kamu, özel, muayenehane)
  - altTur: Alt tür filtreleme

Response: {
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

### Tek Kişi Detayı
```
GET /api/contacts/:id
Response: { "id": "...", "hastaneAdi": "...", ... }
```

### Yeni Kişi Ekle
```
POST /api/contacts
Body: {
  "hastaneAdi": "Ankara Şehir Hastanesi",
  "il": "Ankara",
  "hastaneTuru": "kamu",
  "altTur": "eğitim araştırma",
  "telefonDoktor": "0312 xxx xx xx",
  ...
}
```

### Kişi Güncelle
```
PUT /api/contacts/:id
Body: { ... }
```

### Kişi Sil
```
DELETE /api/contacts/:id
```

### Excel İçe Aktar
```
POST /api/contacts/import
Content-Type: multipart/form-data
Body: file (Excel dosyası)
```

## Local Geliştirme (Docker Olmadan)

### Gereksinimler
- Node.js (v20+)
- PostgreSQL (v14+)
- npm veya yarn

### Backend Kurulumu

```bash
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasındaki DATABASE_URL'i düzenle (localhost kullan)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/orubacontacts"

# Prisma migrate
npm run db:migrate

# Prisma client generate
npm run db:generate

# Geliştirme modunda başlat
npm run dev
```

### Frontend Kurulumu

```bash
cd frontend

# Bağımlılıkları yükle
npm install

# .env.local dosyası oluştur
echo "REACT_APP_API_URL=http://localhost:3000" > .env.local

# Geliştirme sunucusunu başlat
npm start
```

## Proje Yapısı

```
orubacontacts/
├── backend/
│   ├── src/
│   │   ├── controllers/     # İş mantığı
│   │   ├── routes/          # API route'ları
│   │   ├── scripts/         # Yardımcı scriptler
│   │   └── index.ts         # Uygulama giriş noktası
│   ├── prisma/
│   │   └── schema.prisma    # Veritabanı şeması
│   ├── Dockerfile           # Backend Docker image
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React bileşenleri
│   │   ├── pages/           # Sayfa bileşenleri
│   │   ├── services/        # API servisleri
│   │   └── App.tsx
│   ├── Dockerfile           # Frontend Docker image
│   └── package.json
├── database/                # Database scripts
├── docker-compose.yml       # Multi-container tanımları
└── README.md
```

## Veritabanı Modeli

### Contact Tablosu
```prisma
model Contact {
  id                String   @id @default(uuid())
  hastaneAdi        String   @unique
  il                String
  hastaneTuru       String   # kamu, özel, muayenehane
  altTur            String?  # eğitim araştırma, devlet, ilçe, üniversite
  telefonDoktor     String?
  telefonSatinalma  String?
  telefonBiyomedikal String?
  mailDoktor        String?
  mailSatinalma     String?
  mailBiyomedikal   String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## Sorun Giderme

### Container başlamıyor
```bash
# Log'ları kontrol edin
docker-compose logs

# Container'ları yeniden build edin
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Veritabanı bağlantı hatası
```bash
# Database container'ının çalıştığından emin olun
docker-compose ps database

# Database health check
docker exec orubacontacts-db pg_isready -U postgres
```

### Migration hataları
```bash
# Backend container'a bağlanın ve manual migrate çalıştırın
docker exec -it orubacontacts-backend sh
npx prisma migrate deploy
```

### Port çakışması
Eğer 3000, 5432 veya 8080 portları kullanılıyorsa, `docker-compose.yml` dosyasındaki port mapping'lerini değiştirin:
```yaml
ports:
  - "3001:3000"  # 3000 yerine 3001 kullan
```

## Güvenlik Notları

- Production ortamında güçlü veritabanı şifreleri kullanın
- `.env` dosyalarını asla git'e commit etmeyin
- HTTPS kullanın (production için)
- CORS ayarlarını production için kısıtlayın
- API rate limiting ekleyin
- Input validation her zaman yapılmalı

## Performans İyileştirmeleri

- Nginx gzip compression aktif
- Static asset caching (1 yıl)
- Multi-stage Docker builds (küçük image boyutları)
- PostgreSQL connection pooling
- Index'ler (hastaneAdi, il, hastaneTuru)

## Lisans

Bu proje [MIT Lisansı] altında lisanslanmıştır.

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen pull request göndermeden önce:
1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## İletişim

Sorularınız için [issue açabilirsiniz](https://github.com/yourusername/orubacontacts/issues).

---

Geliştiren: Oruba Team | Son Güncelleme: 2025-10-27
