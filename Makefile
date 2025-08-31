# Makefile for Meet Scribe Frontend
# Common developer tasks mapped to npm scripts.

SHELL := /bin/zsh
.DEFAULT_GOAL := help

## Colors
GREEN=\033[0;32m
NC=\033[0m

.PHONY: help install dev build preview lint gen-api typecheck clean-dist env

help: ## Show this help
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*##"}; /^[$$()% 0-9A-Za-z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies (prefer npm ci when package-lock.json is present)
	@if [ -f package-lock.json ]; then \
		echo "$(GREEN)npm ci$(NC)"; npm ci; \
	else \
		echo "$(GREEN)npm install$(NC)"; npm install; \
	fi

dev: ## Start Vite dev server
	npm run dev

build: ## Type-check and build production assets
	npm run build

preview: ## Preview the production build locally
	npm run preview

lint: ## Run ESLint
	npm run lint

gen-api: ## Generate API client from openapi.yml via orval
	npm run gen:api

typecheck: ## Type-check only (no emit)
	npx tsc -b --pretty false --noEmit

clean-dist: ## Remove dist folder
	rm -rf dist

env: ## Show relevant environment variables
	@echo "VITE_API_BASE_URL=$${VITE_API_BASE_URL}"
	@echo "VITE_LOG_LEVEL=$${VITE_LOG_LEVEL}"
	@echo "VITE_ENABLE_SERVER_LOGS=$${VITE_ENABLE_SERVER_LOGS}"
	@echo "VITE_LOG_ENDPOINT=$${VITE_LOG_ENDPOINT}"
	@echo "VITE_LOG_BATCH_MS=$${VITE_LOG_BATCH_MS}"
