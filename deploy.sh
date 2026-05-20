#!/usr/bin/env bash
# Manual deploy on VM (same result as GitHub Actions): copy local build into frontend-container.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -d build ]] || [[ -z "$(ls -A build 2>/dev/null)" ]]; then
  echo "ERROR: build/ folder missing or empty. Run: npm install && npm run build"
  exit 1
fi

echo "==> Copying build into frontend-container..."
docker cp build/. frontend-container:/usr/share/nginx/html/

echo "==> Restarting frontend-container..."
docker restart frontend-container

echo "==> Deploy complete. Container status:"
docker ps --filter name=frontend-container
