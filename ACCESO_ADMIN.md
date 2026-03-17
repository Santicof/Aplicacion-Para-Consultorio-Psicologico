# 🔐 ACCESO ADMINISTRADOR - CONFIDENCIAL

## ⚠️ IMPORTANTE: Guardar este archivo en un lugar seguro y NO compartirlo

---

## 📍 URL de Acceso (URL Secreta)

**NO compartas esta URL con clientes ni en redes sociales**

```
https://tu-dominio.com/gestion-consultorio-interno
```

💡 **Recomendación:** Guarda esta URL en tus favoritos del navegador para acceso rápido.

---

## 🔑 Credenciales de Acceso

**Las credenciales ahora se gestionan desde variables de entorno (.env)**

### Credenciales por defecto:
- **Usuario:** `adminpsique`  
- **Contraseña:** `Psique@2024!Secure`

⚠️ **IMPORTANTE:** Estas credenciales están configuradas en el archivo `.env` del proyecto.

---

## 📁 Configuración con Variables de Entorno

### Archivo `.env` (ubicación: `frontend/.env`)

```bash
# Credenciales de Administrador
VITE_ADMIN_USERNAME=adminpsique
VITE_ADMIN_PASSWORD=Psique@2024!Secure

# Fecha de última actualización de credenciales
VITE_CREDENTIALS_LAST_UPDATE=2026-03-03

# Días para recordar cambio de credenciales
VITE_CREDENTIALS_ROTATION_DAYS=90

# Configuración de seguridad
VITE_MAX_LOGIN_ATTEMPTS=3
VITE_LOCKOUT_DURATION=15
```

### ¿Cómo cambiar las credenciales?

1. Abre el archivo `frontend/.env`
2. Modifica los valores de:
   - `VITE_ADMIN_USERNAME` (nuevo usuario)
   - `VITE_ADMIN_PASSWORD` (nueva contraseña)
   - `VITE_CREDENTIALS_LAST_UPDATE` (fecha actual en formato YYYY-MM-DD)
3. Guarda el archivo
4. Reinicia la aplicación para aplicar los cambios
5. Accede al panel de seguridad y verifica el estado

⚠️ **NUNCA subas el archivo `.env` a Git** (ya está en `.gitignore`)

---

## 🛡️ Medidas de Seguridad Implementadas

### ✅ Ya Implementado (Nivel Intermedio):

1. **URL Secreta**
   - Ruta oculta: `/gestion-consultorio-interno`
   - No aparece en menús públicos
   - Solo accesible conociendo la URL exacta

2. **Variables de Entorno** ⭐ NUEVO
   - Credenciales fuera del código fuente
   - Fácil rotación sin tocar el código
   - Configuración centralizada

3. **Protección contra Fuerza Bruta**
   - Máximo 3 intentos de login (configurable)
   - Bloqueo automático por 15 minutos (configurable)
   - Contador de intentos visible
   - Sistema persistente entre sesiones

4. **Logging de Seguridad** ⭐ NUEVO
   - Registro automático de:
     * Accesos exitosos
     * Intentos fallidos
     * Bloqueos de cuenta
     * Cierres de sesión
   - Almacenamiento local de logs
   - Exportación de logs para auditoría
   - Estadísticas de seguridad

5. **Rotación de Credenciales** ⭐ NUEVO
   - Sistema de recordatorio automático (90 días)
   - Alertas visuales cuando expiran
   - Advertencias 7 días antes del vencimiento
   - Tracking de última actualización

6. **Panel de Seguridad** ⭐ NUEVO
   - Vista completa de actividad de login
   - Estadísticas en tiempo real
   - Exportación de logs
   - Estado de credenciales visible
   - Recomendaciones de seguridad

7. **Sin Exposición de Credenciales**
   - Credenciales eliminadas de la pantalla
   - Solo mensaje de advertencia para personal autorizado

8. **Menú Limpio**
   - Enlace "Admin" eliminado del menú público
   - Solo visible cuando ya estás autenticado

---

## 📊 Panel de Seguridad (Nueva Funcionalidad)

Accede a la pestaña **🔐 Seguridad** en el panel de administración para ver:

### 1. Estado de Credenciales
- Fecha de última actualización
- Días transcurridos
- Días restantes hasta próxima rotación
- Alertas visuales según estado

### 2. Estadísticas de Acceso
- Total de accesos exitosos
- Intentos fallidos
- Número de bloqueos
- Último acceso registrado

### 3. Registro de Actividad (Logs)
- Últimos 20 eventos de seguridad
- Fecha/hora de cada evento
- Usuario que intentó acceder
- Detalles del evento
- Exportación a JSON

### 4. Mejores Prácticas
- Guía de seguridad integrada
- Señales de alerta a vigilar
- Procedimientos en caso de incidente

---

## 🚀 Próximas Mejoras Recomendadas

### 📋 Nivel Intermedio (Próximo paso):

- [ ] **Autenticación con Backend Real**
  - Mover credenciales del frontend al servidor
  - Usar tokens JWT
  - Proteger endpoints de la API

- [ ] **Variables de Entorno**
  - Guardar credenciales fuera del código
  - Usar `.env` para configuración

- [ ] **Logging de Accesos**
  - Registrar todos los intentos de login
  - Guardar IPs y timestamps
  - Alertas por actividad sospechosa

### 🔒 Nivel Avanzado (Futuro):

- [ ] **Autenticación de Dos Factores (2FA)**
  - Código por WhatsApp o Email
  - Verificación adicional al login

- [ ] **CAPTCHA**
  - Prevenir bots automáticos
  - Google reCAPTCHA v3

- [ ] **Whitelist de IPs**
  - Solo permitir acceso desde IPs específicas
  - Ideal si siempre trabajas desde la misma red

- [ ] **Rotación Automática de Contraseñas**
  - Cambio obligatorio cada 90 días
  - Notificaciones de vencimiento

---

## 📱 ¿Cómo Acceder?

### Opción 1: Desde la PC del Consultorio
1. Abre tu navegador (Chrome, Firefox, etc.)
2. Guarda en favoritos: `tu-dominio.com/gestion-consultorio-interno`
3. Haz clic en el favorito cuando necesites gestionar turnos
4. Ingresa usuario y contraseña

### Opción 2: Desde el Celular
1. Abre el navegador del celular
2. Escribe la URL completa
3. Agrega a pantalla de inicio para acceso rápido
4. Ingresa credenciales

---

## ⚡ ¿Qué Hago si me Bloquearon?

Si ingresaste mal la contraseña 3 veces:
1. **Espera 15 minutos** - El bloqueo es automático
2. **No cierres el navegador** - El contador sigue corriendo
3. **Asegúrate de escribir bien la contraseña** - Mayúsculas/minúsculas importan

---

## 🔄 Cambiar Credenciales (Recomendado cada 3 meses)

Para cambiar las credenciales, contacta al desarrollador o modifica el archivo:
```
frontend/src/pages/Login.jsx
```

Busca la línea:
```javascript
if (credenciales.usuario === 'adminpsique' && credenciales.password === 'Psique@2024!Secure')
```

Y cambia ambos valores por tus nuevas credenciales.

---

## 📞 Soporte Técnico

Si tienes problemas con el acceso:
- Verifica que la URL esté correcta
- Asegúrate de estar conectado a internet
- Limpia caché del navegador
- Prueba en modo incógnito

---

## ⚠️ RECORDATORIOS DE SEGURIDAD

❌ **NO HACER:**
- Compartir la URL con clientes
- Publicar en redes sociales
- Guardar contraseña en notas del celular sin protección
- Acceder desde computadoras públicas
- Usar la misma contraseña en otros sitios

✅ **SÍ HACER:**
- Cerrar sesión al terminar
- Usar HTTPS siempre (candado en navegador)
- Cambiar contraseña periódicamente
- Guardar credenciales en gestor de contraseñas seguro
- Reportar accesos sospechosos

---

**Última actualización:** Marzo 2026  
**Nivel de seguridad actual:** BÁSICO  
**Estado:** ✅ Funcional y operativo

