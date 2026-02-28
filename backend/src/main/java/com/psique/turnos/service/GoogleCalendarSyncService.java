package com.psique.turnos.service;

import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;
import com.psique.turnos.config.GoogleCalendarConfig;
import com.psique.turnos.model.Turno;
import com.psique.turnos.repository.TurnoRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class GoogleCalendarSyncService {

    private final Calendar calendar;
    private final GoogleCalendarConfig config;
    private final TurnoRepository turnoRepository;

    @Value("${google.calendar.id:primary}")
    private String calendarId;

    @Value("${google.calendar.timezone:America/Argentina/Buenos_Aires}")
    private String timezone;

    @Autowired
    public GoogleCalendarSyncService(
            @Autowired(required = false) Calendar calendar,
            GoogleCalendarConfig config,
            TurnoRepository turnoRepository) {
        this.calendar = calendar;
        this.config = config;
        this.turnoRepository = turnoRepository;
    }

    /**
     * Sincroniza cambios desde Google Calendar a la base de datos local.
     * Se invoca manualmente desde el botón del panel de administración.
     */
    @Transactional
    public void syncFromGoogleCalendar() {
        if (!config.isCalendarEnabled() || calendar == null) {
            return;
        }

        try {
            // Obtener eventos desde hace 7 días hasta 30 días en el futuro
            com.google.api.client.util.DateTime start = new com.google.api.client.util.DateTime(
                    System.currentTimeMillis() - (7L * 24 * 60 * 60 * 1000));
            com.google.api.client.util.DateTime end = new com.google.api.client.util.DateTime(
                    System.currentTimeMillis() + (30L * 24 * 60 * 60 * 1000));

            Events events = calendar.events().list(calendarId)
                    .setTimeMin(start)
                    .setTimeMax(end)
                    .setSingleEvents(true)
                    .setShowDeleted(true)  // incluir eventos eliminados (status="cancelled")
                    .setOrderBy("startTime")
                    .execute();

            List<Event> items = events.getItems();
            log.debug("🔄 Sync Google Calendar: {} eventos encontrados en el rango", items.size());

            int actualizados = 0;
            int eliminados = 0;
            int sinVincular = 0;  // eventos de Google sin turno en BD
            int sinCambios = 0;   // encontrados en BD pero sin cambio de hora

            for (Event event : items) {
                if (event.getSummary() != null && event.getSummary().startsWith("Turno: ")) {
                    int resultado = processEventChange(event);
                    if (resultado == 1) actualizados++;
                    else if (resultado == 2) eliminados++;
                    else if (resultado == -1) sinVincular++;
                    else sinCambios++;
                }
            }

            log.info("🔄 Sincronización completa: {} actualizados, {} eliminados, {} sin vínculo BD, {} sin cambios",
                actualizados, eliminados, sinVincular, sinCambios);

        } catch (IOException e) {
            log.error("❌ Error al sincronizar desde Google Calendar: {}", e.getMessage());
        }
    }

    /**
     * Procesa un evento individual que cambió en Google Calendar
     * @return 0 = sin cambios / sin match, 1 = actualizado, 2 = eliminado
     */
    @Transactional
    public int processEventChange(Event event) {
        String eventId = event.getId();

        // Buscar turno en la BD por googleEventId
        Optional<Turno> turnoOpt = turnoRepository.findByGoogleEventId(eventId);

        if (turnoOpt.isEmpty()) {
            log.info("⚠️ Evento '{}' (id={}) no tiene turno vinculado en BD — fue creado fuera de la app o google_event_id no está guardado",
                event.getSummary(), eventId);
            return -1; // sin vínculo en BD
        }

        Turno turno = turnoOpt.get();

        // Si el evento fue cancelado/eliminado en Google Calendar
        if ("cancelled".equals(event.getStatus())) {
            log.info("🗑️ Evento cancelado en Google Calendar, eliminando turno ID: {} ({})", 
                turno.getId(), turno.getPaciente().getNombre());
            turnoRepository.delete(turno);
            return 2;
        }

        // Si el evento fue modificado (cambio de fecha/hora)
        if (event.getStart() != null && event.getStart().getDateTime() != null) {
            LocalDateTime newDateTime = convertToLocalDateTime(event.getStart().getDateTime());
            LocalDate newDate = newDateTime.toLocalDate();
            LocalTime newTime = newDateTime.toLocalTime().withSecond(0).withNano(0);

            // Normalizar hora del turno (quitar segundos/nanos para comparar)
            LocalTime turnoHora = turno.getHora().withSecond(0).withNano(0);

            log.debug("🕐 Comparando turno {}: BD={} {} vs Google={} {}",
                turno.getId(), turno.getFecha(), turnoHora, newDate, newTime);

            boolean changed = false;

            if (!turno.getFecha().equals(newDate)) {
                log.info("📅 Fecha cambiada en Google Calendar para turno {} ({}): {} → {}",
                    turno.getId(), turno.getPaciente().getNombre(),
                    turno.getFecha(), newDate);
                turno.setFecha(newDate);
                changed = true;
            }

            if (!turnoHora.equals(newTime)) {
                log.info("⏰ Hora cambiada en Google Calendar para turno {} ({}): {} → {}",
                    turno.getId(), turno.getPaciente().getNombre(),
                    turnoHora, newTime);
                turno.setHora(newTime);
                changed = true;
            }

            if (changed) {
                turnoRepository.save(turno);
                log.info("✅ Turno {} actualizado en BD: {}/{}", turno.getId(), turno.getFecha(), turno.getHora());
                return 1;
            }
        }
        
        return 0;
    }

    /**
     * Convierte DateTime de Google Calendar a LocalDateTime.
     *
     * ESTRATEGIA: el Google Calendar del usuario está en UTC.
     * Los eventos se crean enviando la hora local de Buenos Aires como UTC.
     * Por lo tanto, al leer de vuelta, el valor UTC ES la hora local de Buenos Aires.
     *
     * Ejemplo: turno a las 09:00 BA → se envió como 09:00Z → Google almacena 09:00 UTC
     * → getValue() = 09:00 UTC millis → leemos 09:00 como hora local → correcto ✓
     *
     * Si el usuario mueve el evento de 09:00 a 13:00 en su calendario UTC,
     * Google almacena 13:00 UTC → leemos 13:00 como hora local → correcto ✓
     */
    private LocalDateTime convertToLocalDateTime(com.google.api.client.util.DateTime dateTime) {
        if (dateTime == null) {
            return null;
        }

        long utcMillis = dateTime.getValue();
        // Leer el valor UTC directamente como hora local (sin conversión de timezone)
        LocalDateTime result = LocalDateTime.ofInstant(
            Instant.ofEpochMilli(utcMillis), ZoneOffset.UTC);

        log.info("🕐 GCal→App: Google='{}' → hora local={}", dateTime, result);

        return result;
    }
}
