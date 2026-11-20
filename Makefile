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
	docker compose -f compose.test.yml up --force-recreate --abort-on-container-exit --exit-code-from tests

clean:
	docker compose down -v
