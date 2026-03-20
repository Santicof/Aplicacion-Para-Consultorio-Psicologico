#!/bin/bash
# ============================================
# Configurar SSL con Let's Encrypt
# Uso: ./setup-ssl.sh tu-dominio.com
# ============================================

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Uso: ./setup-ssl.sh tu-dominio.com"
    exit 1
fi

echo "Configurando SSL para: $DOMAIN"

# 1. Obtener certificado
echo "[1/3] Obteniendo certificado SSL..."
cd /opt/psique/app/deploy
docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot --webroot-path=/var/www/certbot \
    --email admin@$DOMAIN --agree-tos --no-eff-email \
    -d $DOMAIN

# 2. Actualizar nginx.conf con SSL
echo "[2/3] Activando HTTPS en Nginx..."
cat > /opt/psique/app/deploy/nginx.conf << NGINXEOF
# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://psique-app:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 15M;
    }
}
NGINXEOF

# 3. Reiniciar nginx
echo "[3/3] Reiniciando Nginx..."
docker compose -f docker-compose.prod.yml restart nginx

echo ""
echo "✅ SSL configurado para https://$DOMAIN"
echo "El certificado se renueva automáticamente."
echo ""
echo "IMPORTANTE: Actualizar GOOGLE_CALENDAR_REDIRECT_URI en .env:"
echo "  GOOGLE_CALENDAR_REDIRECT_URI=https://$DOMAIN/oauth2callback"
echo "Y reiniciar: docker compose -f docker-compose.prod.yml up -d"
