#!/bin/bash
# GramFlow Azure App Service Startup Script
# Runs npm install on first boot (since node_modules are not in the deployment package)
set -e

cd /home/site/wwwroot

# Install production dependencies if node_modules is missing or incomplete
if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ]; then
  echo "[startup] node_modules not found — installing production dependencies..."
  # Use backend/package.json which has all the deps listed
  npm install --production --prefix . --package-lock-only 2>/dev/null || true
  npm ci --omit=dev 2>&1 || npm install --omit=dev 2>&1
  echo "[startup] Dependencies installed."
else
  echo "[startup] node_modules found, skipping install."
fi

echo "[startup] Starting GramFlow backend on port ${PORT:-8080}..."
exec node backend/dist/backend/src/index.js
