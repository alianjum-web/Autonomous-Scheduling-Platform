# Autonomous Scheduling Platform — dev / prod commands
# Run `make help` to see all targets.

.PHONY: help env-dev env-prod dev prod dev-api prod-api stop test lint db-validate db-push db-link

help:
	@echo "Environment"
	@echo "  make env-dev     Copy .env.development → active env files"
	@echo "  make env-prod    Copy .env.production  → active env files"
	@echo ""
	@echo "Development (hot-reload)"
	@echo "  make dev         Redis + API (docker) + Next.js dev server"
	@echo "  make dev-api     API only via docker compose"
	@echo ""
	@echo "Production simulation (local)"
	@echo "  make prod        Build & run API (docker) + Next.js production server"
	@echo "  make prod-api    API only — production docker compose"
	@echo ""
	@echo "Utilities"
	@echo "  make stop        Stop docker services"
	@echo "  make test        Run backend + frontend tests"
	@echo "  make lint        Run frontend eslint"
	@echo ""
	@echo "Database (Supabase — schema in backend/supabase/)"
	@echo "  make db-validate  Validate migration filenames and layout"
	@echo "  make db-link      Link backend to remote Supabase project"
	@echo "  make db-push      Apply pending migrations to linked project"

env-dev:
	@./scripts/env/sync.sh development

env-prod:
	@./scripts/env/sync.sh production

dev-api:
	docker compose up --build

dev: env-dev
	@echo "Starting development stack..."
	-docker compose up --build -d redis api
	@cd frontend && npm run dev

prod-api:
	docker compose -f docker-compose.prod.yml up --build

prod: env-prod
	@echo "Starting production simulation..."
	docker compose -f docker-compose.prod.yml up --build -d redis api
	@cd frontend && npm run prod

stop:
	docker compose down
	docker compose -f docker-compose.prod.yml down 2>/dev/null || true

test:
	cd backend && python -m pytest -q
	cd frontend && npm test

lint:
	cd frontend && npm run lint

db-validate:
	bash scripts/db/validate-migrations.sh

db-link:
	cd backend && npm run db:link

db-push:
	cd backend && npm run db:push
