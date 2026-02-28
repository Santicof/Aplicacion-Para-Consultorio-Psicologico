# 🔔 Webhooks de Google Calendar - Sincronización en Tiempo Real

## ¿Qué son los Webhooks?

Los webhooks permiten que Google Calendar **notifique instantáneamente** a tu aplicación cuando hay cambios, en lugar de que la aplicación tenga que consultar constantemente.

## 🎯 Ventajas

✅ **Sincronización instantánea**: Los cambios se detectan al momento  
✅ **Eficiencia**: No hay consultas innecesarias  
✅ **Menor uso de recursos**: Sin polling constante  
✅ **Respeta límites de API**: Menos requests a Google  

## ⚙️ Configuración Actual

### Modo Actual: Polling de Respaldo
- ✅ Sincronización cada 10 minutos automáticamente
- ✅ Webhook endpoint listo en `/api/webhooks/google-calendar`
- ⏳ Webhooks desactivados (requiere URL pública)

## 🚀 Activar Webhooks en Tiempo Real

### Opción 1: Durante Desarrollo (ngrok)

1. **Instala ngrok**:
   ```bash
   # Descarga desde https://ngrok.com/download
   # O con chocolatey:
   choco install ngrok
   ```

2. **Inicia ngrok**:
   ```bash
   ngrok http 3000
   ```
   
3. **Copia la URL pública** (ej: `https://abc123.ngrok.io`)

4. **Configura en application.yml**:
   ```yaml
   google:
     calendar:
       webhook:
         enabled: true
         url: "https://abc123.ngrok.io/api/webhooks/google-calendar"
   ```

5. **Reinicia el backend** - Los webhooks se registrarán automáticamente

### Opción 2: Producción (Servidor Real)

1. **Despliega tu aplicación** en:
   - Railway
   - Heroku
   - AWS
   - Digital Ocean
   - Otro servicio con URL pública

2. **Configura la URL en application.yml**:
   ```yaml
   google:
     calendar:
       webhook:
         enabled: true
         url: "https://tu-dominio.com/api/webhooks/google-calendar"
   ```

3. **Asegúrate que el puerto 3000 esté expuesto**

4. **Reinicia el backend**

## 🔍 Verificar Funcionamiento

Una vez activados los webhooks, verás en los logs:

```
✅ Webhook registrado exitosamente en Google Calendar
📡 Channel ID: abc-123-def-456
⏰ Expira: [fecha]
🔔 Recibirás notificaciones cuando cambien eventos en Google Calendar
```

Cuando muevas un turno en Google Calendar:

```
📡 Webhook recibido de Google Calendar
🔔 Cambio detectado en Google Calendar - sincronizando AHORA...
📅 Fecha cambiada en Google Calendar para turno 28: 2026-02-27 → 2026-02-28
✅ Sincronización instantánea completada
```

## 🛡️ Sistema de Respaldo

Sin importar si los webhooks están activos, el sistema tiene:
- ✅ Sincronización automática cada 10 minutos
- ✅ Botón manual "Sincronizar Calendar" en panel admin
- ✅ Auto-refresh del frontend cada 5 segundos

## 📋 Estado Actual de Sincronización

| Método | Estado | Latencia |
|--------|--------|----------|
| Webhooks | ⏳ Inactivo (requiere URL pública) | Instantáneo (< 1 seg) |
| Polling automático | ✅ Activo | 10 minutos máximo |
| Sincronización manual | ✅ Disponible | Inmediato al hacer clic |
| Frontend auto-refresh | ✅ Activo | 5 segundos |

## 💡 Recomendaciones

### Para Desarrollo Local
- Usa **ngrok** para probar webhooks
- Mantén el polling de respaldo activo

### Para Producción
- **Activa webhooks** para sincronización instantánea
- Configura renovación automática (webhooks expiran en 7 días)
- Mantén el polling como respaldo

## 🔧 Troubleshooting

### Los webhooks no se registran
- Verifica que la URL sea pública y accesible
- Asegúrate que `webhook.enabled: true` en application.yml
- Revisa los logs del backend para errores

### No llegan notificaciones
- Verifica que el endpoint esté accesible desde Internet
- Comprueba que no haya firewall bloqueando
- Revisa que la URL en Google Calendar sea correcta

### Webhooks expiraron
Los webhooks duran 7 días. Para renovarlos:
- Reinicia el backend (se re-registran automáticamente)
- O implementa renovación automática antes del vencimiento
