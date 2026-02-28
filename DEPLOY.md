# 🚀 Guía de Deploy - Aplicación Monolítica

## 📋 Arquitectura

Esta aplicación está configurada como **monolito**: Spring Boot sirve tanto el backend (API REST) como el frontend (React compilado).

**Ventajas:**
- ✅ Un solo servidor, un solo puerto (3000)
- ✅ Sin problemas de CORS
- ✅ Deploy más simple
- ✅ Más económico

---

## 🛠️ Opciones de Deploy

### **Opción 1: Railway.app (RECOMENDADO - GRATIS)**

1. **Crear cuenta en [Railway.app](https://railway.app)**

2. **Subir código a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "App lista para deploy"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

3. **En Railway:**
   - Click en "New Project" → "Deploy from GitHub"
   - Seleccionar tu repositorio
   - Railway detectará automáticamente el `docker-compose.yml`
   - Agregar variables de entorno (opcionales):
     ```
     SPRING_PROFILES_ACTIVE=prod
     ```

4. **Railway te dará un dominio gratis:**
   ```
   https://tu-app.railway.app
   ```

**Costo:** GRATIS ($5/mes de crédito gratis, luego $0.000231/GB-hora)

---

### **Opción 2: Render.com (GRATIS)**

1. **Crear cuenta en [Render.com](https://render.com)**

2. **Crear nuevo Web Service:**
   - Connect GitHub
   - Seleccionar repo
   - Environment: Docker
   - Plan: Free

3. **Configurar:**
   - Build Command: `docker build -f backend/Dockerfile .`
   - Start Command: (automático con Dockerfile)
   
4. **Agregar PostgreSQL:**
   - Dashboard → New → PostgreSQL (Free tier)
   - Copiar la URL interna
   - Agregar variable de entorno en el Web Service:
     ```
     SPRING_DATASOURCE_URL=<URL de PostgreSQL>
     ```

**Costo:** GRATIS (con limitaciones: sleep después de 15 min de inactividad)

---

### **Opción 3: VPS (DigitalOcean/Linode) - $5-10/mes**

1. **Crear Droplet:**
   - Ubuntu 22.04
   - $5/mes (1GB RAM)
   - Instalar Docker:
     ```bash
     curl -fsSL https://get.docker.com -o get-docker.sh
     sudo sh get-docker.sh
     sudo apt install docker-compose -y
     ```

2. **Subir código:**
   ```bash
   git clone https://github.com/tu-usuario/tu-repo.git
   cd tu-repo
   ```

3. **Configurar dominio** (opcional):
   - Comprar dominio en Namecheap/GoDaddy
   - Apuntar DNS A Record a IP del servidor
   - Instalar Nginx + Certbot para HTTPS

4. **Ejecutar:**
   ```bash
   docker-compose up -d
   ```

5. **Configurar Nginx reverse proxy:**
   ```nginx
   server {
       listen 80;
       server_name tudominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

### **Opción 4: AWS/Azure/GCP (Profesional)**

Similar a VPS pero con más opciones de escalabilidad.
- AWS Lightsail: $3.50/mes
- Google Cloud Run: Pay per use
- Azure App Service: ~$13/mes

---

## 📦 Comandos de Build

### **Local (sin Docker):**
```bash
# Windows
build.bat

# Linux/Mac
chmod +x build.sh
./build.sh

# Ejecutar
java -jar backend/target/consultorio-turnos-1.0.0.jar
```

### **Con Docker:**
```bash
# Build y ejecutar
docker-compose up --build

# Detener
docker-compose down

# Logs
docker-compose logs -f app
```

---

## 🔧 Variables de Entorno para Producción

```env
# Base de datos
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/dbname
SPRING_DATASOURCE_USERNAME=usuario
SPRING_DATASOURCE_PASSWORD=password_seguro

# Perfil
SPRING_PROFILES_ACTIVE=prod

# Opcional: Puerto
SERVER_PORT=3000
```

---

## ✅ Checklist Pre-Deploy

- [ ] Frontend compila sin errores (`npm run build`)
- [ ] Backend compila sin errores (`mvn clean package`)
- [ ] Variables de entorno configuradas
- [ ] Base de datos accesible
- [ ] Puerto 3000 disponible
- [ ] SSL/HTTPS configurado (producción)

---

## 🌐 URLs Después del Deploy

- **Aplicación completa:** `http://tudominio.com:3000` o `https://tudominio.com`
- **API Backend:** `http://tudominio.com:3000/api/*`
- **Frontend:** `http://tudominio.com:3000/` (home, login, agendar, etc.)

---

## 🆘 Troubleshooting

**Error: "Cannot connect to database"**
- Verificar SPRING_DATASOURCE_URL
- Verificar que PostgreSQL está corriendo
- Verificar credenciales

**Error: "404 en rutas de React"**
- Verificar que WebConfig.java existe
- Verificar que el frontend se copió a `/static`

**Error: "Out of memory"**
- Aumentar memoria del servidor
- Agregar `JAVA_OPTS=-Xmx512m` (limitar memoria Java)

---

## 💰 Recomendación de Costos

| Opción | Costo Mensual | Mejor Para |
|--------|---------------|------------|
| Railway.app | Gratis/$5 | Testing y MVP |
| Render.com | Gratis | Demo (sleep mode) |
| DigitalOcean VPS | $5-10 | Producción pequeña |
| AWS Lightsail | $3.50+ | Producción con escalabilidad |

**Recomendación:** Empieza con Railway (gratis), migra a VPS cuando tengas ~100+ usuarios diarios.
