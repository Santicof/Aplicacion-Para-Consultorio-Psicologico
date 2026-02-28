# 🔄 Sincronización Bidireccional con Google Calendar

## ¿Cómo funciona?

Con esta configuración, tu aplicación se sincroniza automáticamente con Google Calendar en **ambas direcciones**:

### **App → Google Calendar** ✅ (Ya implementado)
- Crear turno en la app → Se crea evento en Google Calendar
- Modificar turno en la app → Se actualiza evento en Google Calendar
- Eliminar turno en la app → Se elimina evento en Google Calendar

### **Google Calendar → App** 🆕 (Nueva funcionalidad)
- **Mover evento** en Google Calendar → Turno se actualiza con nueva fecha/hora
- **Cancelar evento** en Google Calendar → Turno se elimina de la app
- **Modificar evento** en Google Calendar → Cambios se reflejan en la app

---

## 🎯 Resultado

Cuando muevas un turno en Google Calendar, **automáticamente**:
1. La base de datos se actualiza con la nueva fecha/hora
2. El horario anterior queda libre
3. El nuevo horario queda bloqueado
4. Los pacientes ven el cambio inmediatamente en la página

---

## ⚙️ Configuración

### Requisitos previos:
1. Haber completado la configuración básica de Google Calendar (ver GOOGLE_CALENDAR_SETUP.md)
2. Tener tu aplicación desplegada con **URL pública** (HTTPS obligatorio)

---

## 📡 Paso 1: Exponer tu aplicación públicamente

Google Calendar necesita poder enviar notificaciones a tu servidor. Tienes 3 opciones:

### **Opción A: Ngrok (para desarrollo/testing)**

1. **Instalar ngrok:**
   ```bash
   # Descargar de https://ngrok.com/download
   # O con chocolatey en Windows:
   choco install ngrok
   ```

2. **Ejecutar ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copiar la URL HTTPS:**
   ```
   Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                Copia esta URL
   ```

4. **Configurar en application.yml:**
   ```yaml
   google:
     calendar:
       webhook:
         enabled: true
         url: https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/webhooks/google-calendar
   ```

### **Opción B: Railway/Render (producción)**

Si ya desplegaste en Railway o Render:

1. **Tu URL pública es:**
   ```
   Railway: https://tu-app.railway.app
   Render:  https://tu-app.onrender.com
   ```

2. **Configurar en application.yml:**
   ```yaml
   google:
     calendar:
       webhook:
         enabled: true
         url: https://tu-app.railway.app/api/webhooks/google-calendar
   ```

### **Opción C: VPS con dominio propio**

Si tienes tu propio servidor:

```yaml
google:
  calendar:
    webhook:
      enabled: true
      url: https://tudominio.com/api/webhooks/google-calendar
```

---

## 🔐 Paso 2: Configurar permisos en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs y servicios** → **Credenciales**
4. Haz clic en tu Service Account
5. Ve a la pestaña **"Permisos"**
6. Asegúrate de que tenga el scope:
   ```
   https://www.googleapis.com/auth/calendar.events
   ```

---

## 🚀 Paso 3: Activar la sincronización

1. **Actualiza application.yml:**
   ```yaml
   google:
     calendar:
       enabled: true  # ← Activar Google Calendar
       credentials:
         file: src/main/resources/google-credentials.json
       webhook:
         enabled: true  # ← Activar webhooks
         url: https://tu-url-publica.com/api/webhooks/google-calendar
   ```

2. **Reinicia la aplicación:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Verifica en los logs:**
   ```
   ✅ Google Calendar API configurado correctamente
   ✅ Webhook registrado exitosamente en Google Calendar
   📡 Channel ID: xxxx-xxxx-xxxx
   ⏰ Expira: [fecha]
   ```

---

## 🧪 Paso 4: Probar la sincronización

### **Test 1: Mover un turno**
1. Crea un turno en tu app
2. Ve a Google Calendar
3. Arrastra el evento a otra fecha/hora
4. Refresca tu app → El turno aparece en la nueva fecha ✅

### **Test 2: Cancelar un turno**
1. Crea un turno en tu app
2. Ve a Google Calendar
3. Elimina el evento
4. Refresca tu app → El turno ya no existe ✅

### **Test 3: Verificar bloqueo de horarios**
1. Mueve un turno en Google Calendar
2. Intenta agendar otro turno en ese horario desde la app
3. Debería estar bloqueado ✅

---

## 🔄 Renovación de Webhook

Los webhooks de Google Calendar expiran después de **7 días máximo**.

### **Opción A: Renovación manual**

Cada 6 días, reinicia la aplicación para re-registrar el webhook.

### **Opción B: Renovación automática (avanzado)**

Crea un cron job para renovar automáticamente:

```java
@Scheduled(cron = "0 0 0 */6 * *") // Cada 6 días
public void renewWebhook() {
    webhookService.registerWebhook();
}
```

---

## 🐛 Troubleshooting

### Error: "Webhook registration failed"

**Causa:** Google no puede alcanzar tu URL.

**Solución:**
1. Verifica que la URL sea HTTPS (no HTTP)
2. Verifica que sea accesible públicamente
3. Prueba la URL en tu navegador: `https://tu-url/api/webhooks/google-calendar/health`
4. Si usas ngrok, asegúrate de que esté corriendo

### No recibo notificaciones

**Causa:** El endpoint no está configurado correctamente.

**Solución:**
1. Verifica los logs: busca "📡 Webhook recibido"
2. Prueba manualmente: 
   ```bash
   curl -X POST https://tu-url/api/webhooks/google-calendar \
     -H "X-Goog-Resource-State: exists"
   ```
3. Verifica que `webhook.enabled=true`

### Los cambios no se reflejan en la app

**Causa:** Sincronización no se ejecuta.

**Solución:**
1. Revisa los logs: busca "🔄 Sincronizando eventos"
2. Verifica que `google.calendar.enabled=true`
3. Verifica las credenciales de Google Calendar

### Error: "Channel ID expired"

**Causa:** El webhook expiró (después de 7 días).

**Solución:**
1. Reinicia la aplicación para re-registrar el webhook
2. Implementa renovación automática (ver arriba)

---

## 📊 Monitoreo

### Logs importantes:

```
✅ Webhook registrado exitosamente
📡 Webhook recibido de Google Calendar
🔄 Sincronizando X eventos desde Google Calendar
📅 Fecha cambiada en Google Calendar: 2026-02-24 → 2026-02-25
⏰ Hora cambiada en Google Calendar: 10:00 → 14:00
✅ Turno ID 5 actualizado desde Google Calendar
🗑️ Evento cancelado en Google Calendar, eliminando turno ID: 3
```

### Endpoint de salud:

```bash
curl https://tu-url/api/webhooks/google-calendar/health
# Respuesta: "Webhook endpoint activo y funcionando"
```

---

## 🔒 Seguridad

### Validación de notificaciones (opcional pero recomendado):

Para producción, valida que las notificaciones realmente vienen de Google:

1. Verifica los headers `X-Goog-*`
2. Valida el Channel ID contra los registrados
3. Implementa rate limiting

---

## 💡 Flujo completo

```
1. Usuario mueve turno en Google Calendar
        ↓
2. Google detecta el cambio
        ↓
3. Google envía notificación POST a tu webhook
        ↓
4. WebhookController recibe la notificación
        ↓
5. GoogleCalendarSyncService sincroniza eventos
        ↓
6. TurnoRepository actualiza la base de datos
        ↓
7. Frontend ve el cambio automáticamente
```

---

## 🎉 Resultado final

Una vez configurado:

✅ **Cambias en la app** → Se actualiza Google Calendar  
✅ **Cambias en Google Calendar** → Se actualiza la app  
✅ **Horarios siempre sincronizados**  
✅ **No hay conflictos ni dobles reservas**  
✅ **Sincronización en tiempo real**

---

## 📝 Notas adicionales

- Los webhooks se renuevan automáticamente al reiniciar la app
- Puedes tener múltiples webhooks activos simultáneamente
- La sincronización es casi instantánea (1-5 segundos)
- No hay límite de sincronizaciones por día
- Funciona con cualquier cliente de Google Calendar (web, móvil, etc.)

---

## 🆘 ¿Necesitas ayuda?

1. Revisa los logs de la aplicación
2. Verifica que todos los pasos estén completos
3. Prueba con ngrok primero antes de ir a producción
4. Asegúrate de que las credenciales sean válidas

**¡Listo!** Tu app ahora está 100% sincronizada con Google Calendar en ambas direcciones. 🎊
