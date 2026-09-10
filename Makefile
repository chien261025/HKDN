.PHONY: up down restart logs build ps clean test

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f wms-backend

logs-mq:
	docker compose logs -f wms-rabbitmq

build:
	docker compose build

ps:
	docker compose ps

test:
	docker run --rm --network smart-wms_wms-net -e DB_HOST=wms-postgres -v "smart-wms_wms-m2-cache:/root/.m2" -v "$$(pwd)/backend:/app" -w /app maven:3.9-eclipse-temurin-17-alpine mvn test

clean:
	docker compose down -v
