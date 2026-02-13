.PHONY: setup dev lint format typecheck build

setup:
	pnpm install

dev:
	powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1

lint:
	pnpm run lint

format:
	pnpm exec prettier --write "**/*.{ts,tsx,js,jsx,json,md}"

typecheck:
	pnpm run typecheck

build:
	pnpm run build
