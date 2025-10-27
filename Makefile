.PHONY: help build up down restart logs clean db-reset db-backup db-restore test

# Docker Compose komutları için kısayollar
help: ## Tüm kullanılabilir komutları göster
	@echo "Oruba Contacts - Docker Management"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Docker image'larını build et
	@echo "Building Docker images..."
	docker-compose build

build-no-cache: ## Docker image'larını cache kullanmadan build et
	@echo "Building Docker images without cache..."
	docker-compose build --no-cache

up: ## Container'ları başlat (detached mode)
	@echo "Starting containers..."
	docker-compose up -d
	@echo "Containers started successfully!"
	@echo "Frontend: http://localhost:8080"
	@echo "Backend: http://localhost:3000"
	@echo "Database: localhost:5432"

up-logs: ## Container'ları başlat ve log'ları göster
	docker-compose up

down: ## Container'ları durdur
	@echo "Stopping containers..."
	docker-compose down

down-volumes: ## Container'ları durdur ve volume'leri sil (VERİTABANI SİLİNİR!)
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "Containers and volumes removed."; \
	fi

restart: ## Tüm container'ları yeniden başlat
	@echo "Restarting containers..."
	docker-compose restart

restart-backend: ## Backend container'ını yeniden başlat
	docker-compose restart backend

restart-frontend: ## Frontend container'ını yeniden başlat
	docker-compose restart frontend

restart-database: ## Database container'ını yeniden başlat
	docker-compose restart database

logs: ## Tüm container log'larını göster
	docker-compose logs -f

logs-backend: ## Backend log'larını göster
	docker-compose logs -f backend

logs-frontend: ## Frontend log'larını göster
	docker-compose logs -f frontend

logs-database: ## Database log'larını göster
	docker-compose logs -f database

ps: ## Container'ların durumunu göster
	docker-compose ps

shell-backend: ## Backend container'a shell ile bağlan
	docker exec -it orubacontacts-backend sh

shell-database: ## PostgreSQL container'a bağlan
	docker exec -it orubacontacts-db psql -U postgres -d orubacontacts

clean: ## Kullanılmayan Docker resource'larını temizle
	@echo "Cleaning up Docker resources..."
	docker system prune -f
	@echo "Cleanup completed!"

clean-all: ## Tüm Docker resource'larını temizle (dikkatli kullanın!)
	@echo "WARNING: This will remove all unused Docker resources!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a -f --volumes; \
		echo "All resources cleaned!"; \
	fi

db-migrate: ## Database migration'larını çalıştır
	docker exec -it orubacontacts-backend npx prisma migrate deploy

db-reset: ## Veritabanını sıfırla ve yeniden oluştur
	@echo "WARNING: This will reset the database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker exec -it orubacontacts-backend npx prisma migrate reset --force; \
		echo "Database reset completed!"; \
	fi

db-backup: ## Veritabanı yedeklemesi al
	@echo "Creating database backup..."
	@mkdir -p ./backups
	docker exec orubacontacts-db pg_dump -U postgres orubacontacts > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in ./backups/"

db-restore: ## Veritabanını yedekten geri yükle (FILE=backup.sql parametresi gerekli)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make db-restore FILE=backup.sql"; \
		exit 1; \
	fi
	@echo "Restoring database from $(FILE)..."
	docker exec -i orubacontacts-db psql -U postgres orubacontacts < $(FILE)
	@echo "Database restored!"

dev-setup: ## Geliştirme ortamını kur
	@echo "Setting up development environment..."
	cp .env.docker .env
	mkdir -p backend/imports
	touch backend/imports/.gitkeep
	@echo "Development environment ready!"

install: build up ## Tüm projeyi kur ve başlat
	@echo "Installation completed!"
	@echo "Application is running at:"
	@echo "  Frontend: http://localhost:8080"
	@echo "  Backend: http://localhost:3000"
	@echo "  Database: localhost:5432"

health: ## Container'ların sağlık durumunu kontrol et
	@echo "Checking container health..."
	@echo "\nBackend Health:"
	@curl -s http://localhost:3000/health | python3 -m json.tool || echo "Backend is not responding"
	@echo "\nFrontend Health:"
	@curl -s http://localhost:8080/health || echo "Frontend is not responding"
	@echo "\nDatabase Health:"
	@docker exec orubacontacts-db pg_isready -U postgres || echo "Database is not responding"

stats: ## Container resource kullanımını göster
	docker stats --no-stream

rebuild: down build up ## Container'ları durdur, yeniden build et ve başlat
	@echo "Rebuild completed!"

update: ## Container'ları güncelle
	docker-compose pull
	$(MAKE) rebuild

import-excel: ## Excel dosyasını import et (FILE=file.xlsx parametresi gerekli)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required. Usage: make import-excel FILE=data.xlsx"; \
		exit 1; \
	fi
	@echo "Importing Excel file: $(FILE)..."
	cp $(FILE) backend/imports/
	docker exec -it orubacontacts-backend npm run import:excel /app/imports/$$(basename $(FILE))
	@echo "Import completed!"

test-backend: ## Backend testlerini çalıştır
	docker exec -it orubacontacts-backend npm test

test-frontend: ## Frontend testlerini çalıştır
	docker exec -it orubacontacts-frontend npm test

prod-deploy: ## Production deployment (dikkatli kullanın!)
	@echo "Deploying to production..."
	@read -p "Are you sure you want to deploy to production? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(MAKE) db-backup; \
		$(MAKE) down; \
		git pull; \
		$(MAKE) build-no-cache; \
		$(MAKE) up; \
		echo "Production deployment completed!"; \
	fi
