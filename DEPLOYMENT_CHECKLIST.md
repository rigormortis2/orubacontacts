# Deployment Checklist - Oruba Contacts

Bu kontrol listesi, Oruba Contacts projesini güvenli ve başarılı bir şekilde deploy etmenize yardımcı olur.

## Pre-Deployment (Deployment Öncesi)

### Kod Kalitesi
- [ ] Tüm testler başarılı
- [ ] Linting hataları düzeltildi
- [ ] Code review tamamlandı
- [ ] Git branch'leri merge edildi
- [ ] Git tag oluşturuldu (versiyonlama için)

### Environment Konfigürasyonu
- [ ] `.env` dosyası oluşturuldu
- [ ] Production environment variables ayarlandı
- [ ] Database credentials güçlü şifreler ile güncellendi
- [ ] API keys ve secrets güvende saklanıyor
- [ ] `.env` dosyası `.gitignore`'da

### Database
- [ ] Database yedekleme stratejisi hazır
- [ ] Migration'lar test edildi
- [ ] Database connection string doğru
- [ ] Database resource limitleri belirlendi

### Docker
- [ ] Docker ve Docker Compose yüklü
- [ ] `docker-compose.yml` production için optimize edildi
- [ ] Resource limits (CPU, Memory) belirlendi
- [ ] Health check'ler yapılandırıldı
- [ ] Restart policies ayarlandı

### Güvenlik
- [ ] Tüm şifreler değiştirildi (default şifreler kullanılmıyor)
- [ ] CORS ayarları production domain'e göre düzenlendi
- [ ] API rate limiting eklendi (önerilir)
- [ ] HTTPS sertifikası hazır
- [ ] Firewall kuralları tanımlandı
- [ ] Database port'u dış erişime kapalı

## Deployment (Deployment Süreci)

### 1. Sunucu Hazırlığı
- [ ] Sunucu gereksinimleri karşılanıyor
  - [ ] Docker 20.10+
  - [ ] Docker Compose 2.0+
  - [ ] En az 2GB RAM
  - [ ] En az 10GB disk alanı
- [ ] Gerekli portlar açık (80, 443, vb.)
- [ ] Domain DNS ayarları yapıldı

### 2. Kod Deployment
```bash
# Repository'yi clone et
git clone <repository-url>
cd orubacontacts

# Production branch'ine geç
git checkout production
```
- [ ] Repository sunucuya aktarıldı
- [ ] Production branch kullanılıyor

### 3. Environment Kurulumu
```bash
# .env dosyasını oluştur
cp .env.example .env
nano .env  # Production değerlerini gir
```
- [ ] `.env` dosyası production değerleri ile oluşturuldu
- [ ] Database URL doğru
- [ ] API URL'leri doğru

### 4. Docker Build & Run
```bash
# Production modunda build et
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Container'ları başlat
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
- [ ] Docker image'lar başarıyla build edildi
- [ ] Container'lar çalışıyor
- [ ] Health check'ler geçti

### 5. Database Kurulumu
```bash
# Migration'ları çalıştır
docker exec -it orubacontacts-backend npx prisma migrate deploy

# (Opsiyonel) Seed data
docker exec -it orubacontacts-backend npm run db:seed
```
- [ ] Database migration'lar başarılı
- [ ] Database bağlantısı çalışıyor
- [ ] İlk test verisi eklendi

### 6. Reverse Proxy (Nginx)
- [ ] Nginx yapılandırması oluşturuldu
- [ ] SSL sertifikası yüklendi
- [ ] HTTP'den HTTPS'e yönlendirme aktif
- [ ] Gzip compression aktif

## Post-Deployment (Deployment Sonrası)

### Verification (Doğrulama)
- [ ] Frontend erişilebilir
- [ ] Backend API çalışıyor
- [ ] Database bağlantısı aktif
- [ ] Health endpoint'leri cevap veriyor
- [ ] Log'lar düzgün yazılıyor

### Health Checks
```bash
# Health check script'ini çalıştır
./scripts/healthcheck.sh

# veya manuel kontrol
curl http://localhost:3000/health
curl http://localhost:8080/health
```
- [ ] Backend health check: OK
- [ ] Frontend health check: OK
- [ ] Database health check: OK

### Functionality Tests
- [ ] Ana sayfa yükleniyor
- [ ] Login/Authentication çalışıyor (varsa)
- [ ] CRUD işlemleri çalışıyor
- [ ] Excel import çalışıyor
- [ ] Arama ve filtreleme çalışıyor
- [ ] Sayfalama çalışıyor

### Performance
- [ ] Sayfa yüklenme süreleri kabul edilebilir (<3s)
- [ ] API response süreleri normal (<500ms)
- [ ] Database query performance'ı iyi
- [ ] Static asset'ler cache'leniyor

### Monitoring Kurulumu
- [ ] Log aggregation yapılandırıldı
- [ ] Error tracking kuruldu (Sentry, vb.)
- [ ] Uptime monitoring aktif
- [ ] Performance monitoring kuruldu
- [ ] Alert'ler yapılandırıldı

### Backup Strategy
- [ ] Otomatik database backup kuruldu
```bash
# Crontab'a ekle (her gün gece 2'de)
0 2 * * * cd /path/to/orubacontacts && make db-backup
```
- [ ] Backup retention policy belirlendi
- [ ] Backup restore test edildi
- [ ] Off-site backup yapılandırıldı

## Maintenance (Bakım)

### Daily Checks
- [ ] Container'lar çalışıyor
- [ ] Disk kullanımı normal
- [ ] Memory kullanımı normal
- [ ] Log dosyaları kontrol edildi
- [ ] Backup'lar alınıyor

### Weekly Checks
- [ ] Security updates kontrol edildi
- [ ] Performance metrics incelendi
- [ ] Error logs incelendi
- [ ] Database backup restore test edildi

### Monthly Checks
- [ ] Docker image'lar güncellendi
- [ ] Dependencies güncellendi
- [ ] Security audit yapıldı
- [ ] Performance optimization değerlendirildi
- [ ] Capacity planning yapıldı

## Rollback Plan (Geri Alma Planı)

Bir sorun durumunda:

### 1. Hızlı Rollback
```bash
# Önceki versiyona geri dön
git checkout previous-stable-tag

# Container'ları yeniden build et ve başlat
docker-compose down
docker-compose up -d --build
```

### 2. Database Rollback
```bash
# Backup'tan geri yükle
make db-restore FILE=backups/backup_YYYYMMDD_HHMMSS.sql
```

### 3. Full Rollback Checklist
- [ ] Önceki stable version'a geri dönüldü
- [ ] Database backup'ı restore edildi
- [ ] Container'lar yeniden başlatıldı
- [ ] Health check'ler geçti
- [ ] Functionality test edildi
- [ ] Kullanıcılar bilgilendirildi

## Emergency Contacts

- **DevOps Lead**: [İsim] - [Email/Telefon]
- **Backend Developer**: [İsim] - [Email/Telefon]
- **Database Admin**: [İsim] - [Email/Telefon]
- **On-Call Support**: [Telefon]

## Useful Commands

### Container Management
```bash
# Container durumunu kontrol et
docker-compose ps

# Log'ları görüntüle
docker-compose logs -f

# Container'ları yeniden başlat
docker-compose restart

# Resource kullanımını kontrol et
docker stats
```

### Database Management
```bash
# Database backup
make db-backup

# Database restore
make db-restore FILE=backup.sql

# Database shell
make shell-database
```

### Health Checks
```bash
# Full health check
./scripts/healthcheck.sh

# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:8080/health
```

## Common Issues & Solutions

### Issue: Container başlamıyor
**Solution:**
```bash
docker-compose logs [service-name]
docker-compose restart [service-name]
```

### Issue: Database bağlantı hatası
**Solution:**
```bash
docker-compose restart database
docker exec orubacontacts-db pg_isready -U postgres
```

### Issue: Out of memory
**Solution:**
- Resource limitleri artır (docker-compose.prod.yml)
- Memory kullanımını optimize et
- Container'ları yeniden başlat

### Issue: Disk doldu
**Solution:**
```bash
# Kullanılmayan image'ları temizle
docker image prune -a

# Log'ları temizle
docker-compose logs --tail=0
```

## Success Criteria

Deployment başarılı sayılır eğer:
- [ ] Tüm health check'ler geçti
- [ ] Functionality testleri başarılı
- [ ] Performance hedefleri karşılandı
- [ ] Monitoring aktif
- [ ] Backup'lar çalışıyor
- [ ] Dokümantasyon güncel
- [ ] Team bilgilendirildi

## Sign-off

**Deployed by:** ___________________
**Date:** ___________________
**Version:** ___________________
**Approved by:** ___________________

---

Son Güncelleme: 2025-10-27
