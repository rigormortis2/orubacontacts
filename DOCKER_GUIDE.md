# Docker Kullanım Kılavuzu - Oruba Contacts

Bu kılavuz, Oruba Contacts projesinin Docker ile nasıl kullanılacağını detaylı olarak açıklar.

## İçindekiler

- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Makefile Komutları](#makefile-komutları)
- [Docker Compose Profilleri](#docker-compose-profilleri)
- [Container Yönetimi](#container-yönetimi)
- [Veritabanı İşlemleri](#veritabanı-işlemleri)
- [Log Yönetimi](#log-yönetimi)
- [Sorun Giderme](#sorun-giderme)
- [Production Deployment](#production-deployment)

## Hızlı Başlangıç

### 1. Basit Kurulum (Önerilen)

```bash
# Tüm projeyi kur ve başlat
make install

# Alternatif olarak manuel kurulum:
docker-compose up -d
```

### 2. Development Ortamı

```bash
# Hot reload ile development ortamı
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# veya Makefile ile:
make dev-setup
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 3. Production Ortamı

```bash
# Production optimizasyonları ile
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Makefile Komutları

Makefile, Docker işlemlerini kolaylaştıran kısayollar sağlar:

### Temel Komutlar

```bash
make help              # Tüm komutları listele
make build             # Image'ları build et
make up                # Container'ları başlat
make down              # Container'ları durdur
make restart           # Container'ları yeniden başlat
make logs              # Log'ları göster
make ps                # Container durumlarını göster
```

### Build Komutları

```bash
make build             # Normal build
make build-no-cache    # Cache kullanmadan build
make rebuild           # Down + Build + Up
```

### Container Yönetimi

```bash
make restart-backend   # Sadece backend'i yeniden başlat
make restart-frontend  # Sadece frontend'i yeniden başlat
make restart-database  # Sadece database'i yeniden başlat
```

### Log Komutları

```bash
make logs              # Tüm log'lar
make logs-backend      # Sadece backend log'ları
make logs-frontend     # Sadece frontend log'ları
make logs-database     # Sadece database log'ları
```

### Shell Erişimi

```bash
make shell-backend     # Backend container'a shell ile bağlan
make shell-database    # PostgreSQL'e bağlan
```

### Veritabanı Komutları

```bash
make db-migrate        # Migration'ları çalıştır
make db-reset          # Veritabanını sıfırla
make db-backup         # Yedek al
make db-restore FILE=backup.sql  # Yedekten geri yükle
```

### Temizlik Komutları

```bash
make clean             # Kullanılmayan kaynakları temizle
make clean-all         # Tüm Docker kaynaklarını temizle
make down-volumes      # Container'ları ve volume'leri sil
```

### Monitoring Komutları

```bash
make health            # Sağlık kontrolü
make stats             # Resource kullanımı
```

### Excel Import

```bash
make import-excel FILE=data.xlsx  # Excel dosyası import et
```

## Docker Compose Profilleri

### Varsayılan (docker-compose.yml)

Temel production-ready yapılandırma:

```bash
docker-compose up -d
```

### Development (docker-compose.dev.yml)

Hot reload ve debug özellikleri:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Özellikler:
- Source code volume mount (hot reload)
- Node.js debugger port açık (9229)
- Development dependencies
- Detaylı log'lama

### Production (docker-compose.prod.yml)

Optimize edilmiş production yapılandırması:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Özellikler:
- Resource limits (CPU, Memory)
- Restart policies
- Network güvenlik optimizasyonları
- Database port'u kapalı
- Optimize edilmiş image'lar

## Container Yönetimi

### Container Durumlarını Kontrol Etme

```bash
# Tüm container'ların durumu
docker-compose ps

# Detaylı bilgi
docker ps -a

# Sadece çalışan container'lar
docker ps
```

### Container'a Bağlanma

```bash
# Backend container
docker exec -it orubacontacts-backend sh

# Frontend container
docker exec -it orubacontacts-frontend sh

# Database container
docker exec -it orubacontacts-db sh

# PostgreSQL'e direkt bağlan
docker exec -it orubacontacts-db psql -U postgres -d orubacontacts
```

### Container Kaynaklarını Görüntüleme

```bash
# Real-time stats
docker stats

# Container'ların resource kullanımı
docker stats --no-stream

# Makefile ile
make stats
```

## Veritabanı İşlemleri

### Yedekleme (Backup)

```bash
# Otomatik tarih damgalı yedek
make db-backup

# Manuel yedek
docker exec orubacontacts-db pg_dump -U postgres orubacontacts > backup.sql
```

### Geri Yükleme (Restore)

```bash
# Makefile ile
make db-restore FILE=backup.sql

# Manuel restore
docker exec -i orubacontacts-db psql -U postgres orubacontacts < backup.sql
```

### Migration İşlemleri

```bash
# Migration'ları uygula
make db-migrate

# Veritabanını sıfırla (DİKKAT: Tüm veriler silinir!)
make db-reset

# Manuel migration
docker exec -it orubacontacts-backend npx prisma migrate deploy
```

### Veritabanı Sorgulama

```bash
# PostgreSQL shell'e bağlan
make shell-database

# SQL sorgusu çalıştır
docker exec -it orubacontacts-db psql -U postgres -d orubacontacts -c "SELECT COUNT(*) FROM contacts;"
```

## Log Yönetimi

### Log'ları Görüntüleme

```bash
# Tüm log'lar (follow mode)
docker-compose logs -f

# Son 100 satır
docker-compose logs --tail=100

# Belirli bir servisin log'ları
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Makefile ile
make logs
make logs-backend
make logs-frontend
make logs-database
```

### Log Filtreleme

```bash
# Belirli bir zaman aralığı
docker-compose logs --since 2024-01-01
docker-compose logs --since 1h

# Timestamp ile
docker-compose logs -t

# Grep ile filtreleme
docker-compose logs backend | grep "ERROR"
```

## Sorun Giderme

### Container Başlamıyor

```bash
# Log'ları kontrol et
make logs

# Container durumunu kontrol et
docker-compose ps

# Health check
make health

# Container'ı yeniden başlat
make restart-backend
```

### Database Bağlantı Hatası

```bash
# Database container'ının çalıştığını kontrol et
docker-compose ps database

# Database health check
docker exec orubacontacts-db pg_isready -U postgres

# Database log'larını kontrol et
make logs-database

# Database'i yeniden başlat
make restart-database
```

### Port Çakışması

Port çakışması varsa `docker-compose.yml` dosyasını düzenleyin:

```yaml
services:
  backend:
    ports:
      - "3001:3000"  # 3000 yerine 3001

  frontend:
    ports:
      - "8081:80"    # 8080 yerine 8081
```

### Build Hataları

```bash
# Cache'i temizle ve yeniden build et
make build-no-cache

# Docker sistem temizliği
make clean

# Tüm container'ları ve image'ları temizle
make down
docker-compose down --rmi all
make build
make up
```

### Memory Hataları

Resource limitleri artırın (`docker-compose.prod.yml`):

```yaml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

### Volume Sorunları

```bash
# Volume'leri listele
docker volume ls

# Volume detaylarını görüntüle
docker volume inspect orubacontacts-postgres-data

# Volume'leri temizle (DİKKAT: Veri kaybı!)
make down-volumes
```

## Production Deployment

### Güvenlik Kontrol Listesi

- [ ] Güçlü database şifreleri kullanın
- [ ] `.env` dosyalarını git'e eklemeyin
- [ ] HTTPS yapılandırın (Nginx + Let's Encrypt)
- [ ] CORS ayarlarını kısıtlayın
- [ ] Rate limiting ekleyin
- [ ] Database backup stratejisi oluşturun
- [ ] Log rotation yapılandırın
- [ ] Container resource limitleri belirleyin

### Production Deployment Adımları

```bash
# 1. Veritabanı yedeği alın
make db-backup

# 2. Container'ları durdurun
make down

# 3. Son değişiklikleri çekin
git pull

# 4. Image'ları yeniden build edin
make build-no-cache

# 5. Production modunda başlatın
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Health check yapın
make health

# veya tek komutla:
make prod-deploy
```

### Environment Variables (Production)

Production için `.env` dosyası oluşturun:

```bash
# Database
POSTGRES_USER=orubauser
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=orubacontacts

# Backend
DATABASE_URL=postgresql://orubauser:strong_password_here@database:5432/orubacontacts
NODE_ENV=production
PORT=3000

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
```

### Monitoring

```bash
# Container durumunu izle
watch docker-compose ps

# Resource kullanımını izle
watch docker stats

# Log'ları izle
make logs
```

### Backup Stratejisi

Otomatik backup için cron job:

```bash
# Crontab'a ekle (her gün gece 2'de)
0 2 * * * cd /path/to/orubacontacts && make db-backup
```

### Reverse Proxy (Nginx)

Production'da Nginx reverse proxy kullanmanız önerilir:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Docker Image Boyutları

Optimize edilmiş image boyutları:

- **Backend**: ~200MB (multi-stage build)
- **Frontend**: ~25MB (Nginx Alpine)
- **Database**: ~230MB (PostgreSQL Alpine)

### Image Boyutlarını Kontrol Etme

```bash
docker images | grep orubacontacts
```

### Image Boyutunu Küçültme

```bash
# Build sırasında cache kullanmayın
docker-compose build --no-cache

# Kullanılmayan image'ları temizleyin
docker image prune -a
```

## Best Practices

1. **Development**: Hot reload için `docker-compose.dev.yml` kullanın
2. **Production**: Resource limitleri ile `docker-compose.prod.yml` kullanın
3. **Backup**: Düzenli database backup'ları alın
4. **Monitoring**: Log'ları ve resource kullanımını izleyin
5. **Security**: Güçlü şifreler ve HTTPS kullanın
6. **Updates**: Container'ları düzenli güncelleyin

## Faydalı Kaynaklar

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

Son Güncelleme: 2025-10-27
