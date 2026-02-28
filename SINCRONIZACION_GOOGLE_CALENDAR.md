# Sincronización Bidireccional con Google Calendar

## 📅 Funcionalidad

El sistema ahora tiene sincronización bidireccional completa con Google Calendar:

### 1. Aplicación → Google Calendar
Cuando creas o cancelas un turno en la aplicación:
- ✅ Se crea automáticamente un evento en Google Calendar
- ✅ Se elimina el evento cuando cancelas el turno
- ✅ El evento incluye todos los detalles: paciente, profesional, motivo, contacto

### 2. Google Calendar → Aplicación
Cuando modificas un evento en Google Calendar:
- ✅ Los cambios se sincronizan automáticamente a la aplicación
- ✅ Si cambias la fecha → se actualiza en la aplicación
- ✅ Si cambias la hora → se actualiza en la aplicación
- ✅ Si eliminas el evento → se cancela el turno en la aplicación

## 🔄 Sincronización Automática

El sistema sincroniza cambios desde Google Calendar cada **2 minutos** automáticamente.

Cuando se detecta un cambio, verás en los logs del backend:
```
📅 Fecha cambiada en Google Calendar para turno 28 (octavio): 2026-02-27 → 2026-02-28
⏰ Hora cambiada en Google Calendar para turno 28 (octavio): 08:00 → 05:00
🔄 Sincronización: 1 turnos actualizados, 0 eliminados
```

## 🎯 Panel de Administración

En el panel de administración encontrarás:

### Botón "📅 Sincronizar Calendar"
- Permite forzar una sincronización inmediata
- Útil cuando necesitas ver cambios al instante
- Se desactiva durante la sincronización

### Auto-refresh
- La lista de turnos se recarga automáticamente cada 2 minutos
- Verás los cambios de Google Calendar sin necesidad de refrescar la página manualmente

## 💡 Casos de Uso

### Ejemplo 1: Reagendar desde Google Calendar
1. Abre Google Calendar en tu celular o PC
2. Encuentra el evento "Turno: [Paciente] con [Profesional]"
3. Arrastra el evento a otra fecha u hora
4. Espera 2 minutos (o usa el botón "Sincronizar Calendar")
5. El turno se actualiza en la aplicación con la nueva fecha/hora

### Ejemplo 2: Cancelar desde Google Calendar
1. Abre Google Calendar
2. Encuentra el evento del turno
3. Elimina el evento
4. Espera 2 minutos (o sincroniza manualmente)
5. El turno desaparece del panel de administración

### Ejemplo 3: Ver horarios ocupados
1. Modificas un turno en Google Calendar a un nuevo horario
2. La aplicación detecta el cambio
3. El nuevo horario se marca como ocupado en el calendario
4. El horario anterior queda disponible nuevamente

## ⚙️ Configuración Técnica

### Backend
- **Tarea programada**: `GoogleCalendarSyncService.syncFromGoogleCalendar()`
- **Frecuencia**: 120000ms (2 minutos)
- **Endpoint manual**: `POST /api/turnos/sync`
- **Logs**: Muestra cada cambio detectado con emojis descriptivos

### Frontend
- **Auto-refresh**: Recarga datos cada 2 minutos
- **Sincronización manual**: Botón en panel de administración
- **Estados visuales**: Muestra "Sincronizando..." durante el proceso

## 🔒 Seguridad

- Solo los eventos creados por la aplicación se sincronizan (identificados por el título "Turno: ")
- Los eventos externos en tu calendario no afectan la aplicación
- Cada turno tiene un `googleEventId` único para vinculación

## 📊 Monitoreo

Para ver la actividad de sincronización en tiempo real:
1. Abre la consola del backend
2. Busca líneas con emojis: 📅 🔄 ⏰ 🗑️
3. Cada cambio detectado se registra claramente

## 🚀 Ventajas

✅ **Flexibilidad**: Gestiona turnos desde donde prefieras (app o Google Calendar)
✅ **Movilidad**: Usa Google Calendar en tu celular para reagendar rápido
✅ **Sincronización**: Todos ven los cambios en tiempo real
✅ **Respaldo**: Google Calendar actúa como backup de tus turnos
✅ **Notificaciones**: Recibe recordatorios de Google Calendar automáticamente
