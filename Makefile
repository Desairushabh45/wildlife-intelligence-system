.PHONY: check-backend build-check

check-backend:
	docker compose build backend
	docker compose up -d backend
	docker exec wildlife_backend python -c "import app.main"

build-check: check-backend
