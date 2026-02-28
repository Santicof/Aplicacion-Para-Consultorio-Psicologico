# 📅 Configuración de Google Calendar API

## Guía completa para integrar Google Calendar con tu aplicación de turnos

Esta integración permite que cuando crees, modifiques o elimines un turno en tu aplicación, **automáticamente se refleje en Google Calendar**.

---

## 🎯 ¿Qué hace esta integración?

✅ **Crear turno** → Se crea evento en Google Calendar  
✅ **Modificar turno** → Se actualiza evento en Google Calendar  
✅ **Eliminar turno** → Se elimina evento en Google Calendar  
✅ **Recordatorios automáticos** → Email 1 día antes y notificación 1 hora antes  
✅ **Información completa** → Nombre paciente, profesional, teléfono, motivo

---

## 📋 Pasos de Configuración

### 1️⃣ Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en "Crear proyecto"
3. Nombre: `Consultorio-Psique-Turnos`
4. Haz clic en "Crear"

### 2️⃣ Habilitar Google Calendar API

1. En el menú lateral, ve a **APIs y servicios** → **Biblioteca**
2. Busca "Google Calendar API"
3. Haz clic en "HABILITAR"

### 3️⃣ Crear Service Account (Cuenta de Servicio)

1. Ve a **APIs y servicios** → **Credenciales**
2. Haz clic en **"Crear credenciales"** → **"Cuenta de servicio"**
3. Nombre: `turnos-calendar-service`
4. Descripción: `Service account para sincronizar turnos con Google Calendar`
5. Haz clic en **"Crear y continuar"**
6. Rol: Selecciona **"Editor"** (o puedes crear un rol personalizado)
7. Haz clic en **"Continuar"** y luego **"Listo"**

### 4️⃣ Generar Clave JSON

1. En la lista de cuentas de servicio, haz clic en la que acabas de crear
2. Ve a la pestaña **"Claves"**
3. Haz clic en **"Agregar clave"** → **"Crear nueva clave"**
4. Selecciona **JSON**
5. Haz clic en **"Crear"**
6. Se descargará un archivo JSON (algo como `consultorio-psique-turnos-xxxxx.json`)

### 5️⃣ Compartir el Calendario con la Service Account

1. Abre [Google Calendar](https://calendar.google.com)
2. En la lista de calendarios, haz clic en **⚙️** junto al calendario que quieres usar
3. Selecciona **"Configuración y uso compartido"**
4. En **"Compartir con determinadas personas"**, haz clic en **"+ Agregar personas"**
5. Agrega el email de la service account (lo encuentras en el archivo JSON descargado, campo `client_email`)
   - Ejemplo: `turnos-calendar-service@consultorio-psique-turnos.iam.gserviceaccount.com`
6. Permisos: Selecciona **"Realizar cambios en los eventos"**
7. Haz clic en **"Enviar"**

### 6️⃣ Copiar ID del Calendario (Opcional)

Si quieres usar un calendario específico en lugar del principal:

1. En configuración del calendario, busca **"Integrar calendario"**
2. Copia el **"ID del calendario"** (algo como `xxx@group.calendar.google.com`)
3. Úsalo en la configuración `google.calendar.id`

---

## 🔧 Configuración en la Aplicación

### Opción A: Archivo credentials.json en el proyecto

1. Renombra el archivo JSON descargado a `google-credentials.json`
2. Guárdalo en: `backend/src/main/resources/`
3. **IMPORTANTE:** Agrega al `.gitignore`:
   ```
   **/google-credentials.json
   ```

4. Actualiza `application.yml`:
   ```yaml
   google:
     calendar:
       enabled: true
       credentials:
         file: src/main/resources/google-credentials.json
       id: primary  # o el ID de tu calendario específico
       timezone: America/Argentina/Buenos_Aires
   ```

### Opción B: Variable de entorno (Recomendada para producción)

1. Guarda el archivo JSON en un lugar seguro del servidor
2. Crea variable de entorno:
   ```bash
   # Linux/Mac
   export GOOGLE_CREDENTIALS_PATH=/ruta/a/google-credentials.json
   
   # Windows
   set GOOGLE_CREDENTIALS_PATH=C:\ruta\a\google-credentials.json
   ```

3. Actualiza `application.yml`:
   ```yaml
   google:
     calendar:
       enabled: true
       credentials:
         file: ${GOOGLE_CREDENTIALS_PATH}
       id: primary
       timezone: America/Argentina/Buenos_Aires
   ```

---

## 🧪 Probar la Integración

1. **Reinicia la aplicación:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Verifica los logs:**
   Deberías ver algo como:
   ```
   INFO: Google Calendar habilitado
   ```

3. **Crea un turno desde tu aplicación**

4. **Verifica en Google Calendar:**
   - Abre Google Calendar
   - Deberías ver el evento creado con:
     - Título: "Turno: [Nombre del Paciente]"
     - Hora correcta
     - Descripción con todos los datos
     - Recordatorios configurados

---

## 🎨 Personalización

### Cambiar duración de turnos

En `GoogleCalendarService.java`, línea ~95:
```java
LocalDateTime endDateTime = startDateTime.plusMinutes(60); // Cambiar 60 por duración deseada
```

### Cambiar recordatorios

En `GoogleCalendarService.java`, líneas ~110-113:
```java
new EventReminder().setMethod("email").setMinutes(24 * 60), // 1 día antes
new EventReminder().setMethod("popup").setMinutes(60)       // 1 hora antes
```

### Cambiar color de eventos

En `GoogleCalendarService.java`, línea ~120:
```java
event.setColorId("9"); // 1=Lavanda, 2=Salvia, 3=Uva, 9=Azul, 10=Verde, 11=Rojo
```

---

## 🔒 Seguridad

### ✅ Buenas prácticas:

1. **NUNCA** subas `google-credentials.json` a Git
2. Agrega al `.gitignore`:
   ```
   **/google-credentials.json
   **/*credentials*.json
   ```

3. En producción, usa variables de entorno
4. Restringe permisos de la service account al mínimo necesario
5. Rota las claves periódicamente

---

## 🐛 Troubleshooting

### Error: "File not found: google-credentials.json"
- Verifica que el archivo existe en la ruta especificada
- Revisa que `google.calendar.enabled` esté en `true`

### Error: "403 Forbidden"
- Verifica que compartiste el calendario con la service account
- Verifica que los permisos sean "Realizar cambios en eventos"

### Error: "Calendar API has not been used"
- Ve a Google Cloud Console
- Habilita la Google Calendar API para tu proyecto

### Los eventos no aparecen en Google Calendar
- Verifica que el calendario esté compartido con la service account
- Revisa los logs de la aplicación para ver errores
- Verifica que `google.calendar.id` sea correcto

### Zona horaria incorrecta
- Cambia `google.calendar.timezone` en `application.yml`
- Lista de zonas: [IANA Time Zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

---

## 📊 Monitoreo

Los logs te dirán qué está pasando:

```
✅ INFO: Evento creado en Google Calendar: abc123xyz
✅ INFO: Evento actualizado en Google Calendar: abc123xyz
✅ INFO: Evento eliminado de Google Calendar: abc123xyz
❌ ERROR: Error al crear evento en Google Calendar
ℹ️ INFO: Google Calendar deshabilitado, evento no creado
```

---

## 🚀 Despliegue en Producción

### Railway/Render/VPS:

1. Sube el archivo `google-credentials.json` al servidor (fuera del repositorio Git)
2. Configura la variable de entorno:
   ```
   GOOGLE_CREDENTIALS_PATH=/app/google-credentials.json
   ```
3. Asegúrate de que `google.calendar.enabled=true`

### Docker:

Agrega al `Dockerfile`:
```dockerfile
# Copiar credenciales de Google
COPY google-credentials.json /app/google-credentials.json
ENV GOOGLE_CREDENTIALS_PATH=/app/google-credentials.json
```

O usa Docker secrets para mayor seguridad.

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de la aplicación
2. Verifica que todos los pasos de configuración estén completos
3. Prueba con `google.calendar.enabled=false` para verificar que la app funcione sin Calendar

---

## ✨ Funcionalidades Futuras (Opcional)

- [ ] Sincronización bidireccional (cambios en Google Calendar → App)
- [ ] Múltiples calendarios (uno por profesional)
- [ ] Notificaciones por SMS usando Twilio
- [ ] Invitaciones automáticas por email a pacientes
- [ ] Webhooks de Google Calendar para actualizaciones en tiempo real

---

**¡Listo!** Ahora tu aplicación de turnos está 100% sincronizada con Google Calendar. 🎉
