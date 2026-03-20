#!/bin/bash
# ============================================
# Script de deploy - ejecutar en el servidor
# Uso: ./redeploy.sh
# ============================================

set -e

APP_DIR="/opt/psique/app"
DEPLOY_DIR="$APP_DIR/deploy"

echo "🔄 Desplegando Consultorio Psique..."

cd $APP_DIR

# 1. Pull últimos cambios
echo "[1/4] Descargando cambios..."
git pull origin main

# 2. Rebuild y restart
echo "[2/4] Reconstruyendo contenedores..."
cd $DEPLOY_DIR
docker compose -f docker-compose.prod.yml build --no-cache app

echo "[3/4] Reiniciando aplicación..."
docker compose -f docker-compose.prod.yml up -d

# 4. Limpiar imágenes viejas
echo "[4/4] Limpiando imágenes antiguas..."
docker image prune -f

echo ""
echo "✅ Deploy completado!"
echo ""
# Mostrar estado
docker compose -f docker-compose.prod.yml ps
