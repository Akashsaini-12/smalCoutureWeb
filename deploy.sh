#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Pulling latest code from main..."
git pull origin main

echo "==> Building Docker image website-frontend:latest..."
docker build -t website-frontend:latest .

echo "==> Restarting frontend-container on port 3000..."
docker stop frontend-container 2>/dev/null || true
docker rm frontend-container 2>/dev/null || true

docker run -d \
  --name frontend-container \
  -p 3000:80 \
  --restart unless-stopped \
  website-frontend:latest

echo "==> Deploy complete. Container status:"
docker ps --filter name=frontend-container
