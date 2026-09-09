.PHONY: up down restart logs build ps clean

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f wms-backend

logs-mq:
	docker-compose logs -f wms-rabbitmq

build:
	docker-compose build

ps:
	docker-compose ps

clean:
	docker-compose down -v
