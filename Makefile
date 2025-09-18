# COnfiguration
BACKUP_FILE=pgdata.tar.gz
PROD_CONTAINER=postgres-db
DEV_CONTAINER=postgres-db-dev
DB_NAME=mydb
DB_USER=myuser
DUMP_FILE=db.dump
DEV_VOLUME=postgres_data_dev

.PHONY: backup restore clean start start-dev dump restore-dev clean-dump

# Step 1: Backup the original postgres volume
backup:
	docker run --rm \
		--volumes-from $(PROD_CONTAINER) \
		-v $(shell pwd):/backup \
		busybox \
		tar czf /backup/$(BACKUP_FILE) /var/lib/postgresql/data
	@echo "✅ Backup created: $(BACKUP_FILE)"

# Step 2: Restore backup into new dev volume
restore: backup
	docker volume create $(DEV_VOLUME)
	docker run --rm \
		-v $(DEV_VOLUME):/var/lib/postgresql/data \
		-v $(shell pwd):/backup \
		busybox \
		sh -c "cd /var/lib/postgresql/data && tar xzf /backup/$(BACKUP_FILE) --strip 1"
	@echo "✅ Backup restored into volume: $(DEV_VOLUME)"

# docker exec -t $(PROD_CONTAINER)
# Step 1: Dump the production DB to a file
dump:
	docker exec -i $(PROD_CONTAINER) \
		pg_dump -U $(DB_USER) -Fc $(DB_NAME) > $(DUMP_FILE)
	@echo "✅ Database dumped to $(DUMP_FILE)"

# Step 2: Start the dev DB and restore the dump into it
restore-dev: dump start-dev
	@echo "⏳ Waiting for dev DB to be ready..."
	sleep 5
	cat $(DUMP_FILE) | docker exec -i $(DEV_CONTAINER) \
		pg_restore -U $(DB_USER) -d $(DB_NAME)
	@echo "✅ Dump restored into dev DB"

# Optional: Clean up backup file
clean:
	rm -f $(BACKUP_FILE)
	@echo "🧹 Backup file deleted"

clean-dump:
	rm -f $(DUMP_FILE)
	@echo "🧹 Dump file deleted"

# Start only the dev database container
start-dev:
# 	docker compose up -d $(DEV_CONTAINER)
	docker compose up -d postgres-dev
	@echo "🚀 Dev container started on port 5434"

# Start only the dev database container
start:
	docker compose up -d
	@echo "🚀 All containers started on port 5433 & 5434"