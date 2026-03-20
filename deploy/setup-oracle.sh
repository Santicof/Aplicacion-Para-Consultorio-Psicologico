#!/bin/bash
# ============================================
# Setup inicial del servidor Oracle Cloud
# Ejecutar UNA SOLA VEZ en la VM nueva
# Como root (sudo su) o con sudo
# ============================================

set -e

echo "=========================================="
echo "  Setup servidor Consultorio Psique"
echo "=========================================="

# 1. Actualizar sistema
echo ""
echo "[1/6] Actualizando sistema operativo..."
apt-get update && apt-get upgrade -y

# 2. Instalar Docker
echo ""
echo "[2/6] Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    # Agregar usuario actual al grupo docker
    usermod -aG docker ubuntu
    echo "Docker instalado correctamente"
else
    echo "Docker ya está instalado"
fi

# 3. Instalar Docker Compose
echo ""
echo "[3/6] Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
    echo "Docker Compose instalado correctamente"
else
    echo "Docker Compose ya está instalado"
fi

# 4. Instalar Git
echo ""
echo "[4/6] Instalando Git..."
apt-get install -y git

# 5. Abrir puertos en iptables (Oracle Cloud usa iptables además de Security Lists)
echo ""
echo "[5/6] Configurando firewall (iptables)..."
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
netfilter-persistent save 2>/dev/null || iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
echo "Puertos 80, 443 y 3000 abiertos"

# 6. Crear estructura de directorios
echo ""
echo "[6/6] Creando directorios..."
mkdir -p /opt/psique
mkdir -p /opt/psique/backups

echo ""
echo "=========================================="
echo "  Setup completado!"
echo "=========================================="
echo ""
echo "Próximos pasos:"
echo "  1. Clonar el repositorio:"
echo "     cd /opt/psique && git clone https://github.com/Santicof/Aplicacion-Para-Consultorio-Psicologico.git app"
echo ""
echo "  2. Configurar variables de entorno:"
echo "     cp /opt/psique/app/deploy/.env.example /opt/psique/app/deploy/.env"
echo "     nano /opt/psique/app/deploy/.env"
echo ""
echo "  3. Iniciar la aplicación:"
echo "     cd /opt/psique/app/deploy && docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "  4. (Opcional) Configurar SSL con dominio:"
echo "     ./setup-ssl.sh tu-dominio.com"
echo ""
echo "IMPORTANTE: También abrir puertos 80 y 443 en"
echo "Oracle Cloud > Networking > Virtual Cloud Networks > Security Lists"
echo ""
