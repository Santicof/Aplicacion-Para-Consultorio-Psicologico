package com.psique.turnos.service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventReminder;
import com.psique.turnos.config.GoogleCalendarConfig;
import com.psique.turnos.model.Turno;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;

@Service
@Slf4j
public class GoogleCalendarService {

    private final Calendar calendar;
    private final GoogleCalendarConfig config;

    @Value("${google.calendar.id:primary}")
    private String calendarId;

    @Value("${google.calendar.timezone:America/Argentina/Buenos_Aires}")
    private String timezone;

    @Autowired
    public GoogleCalendarService(@Autowired(required = false) Calendar calendar, GoogleCalendarConfig config) {
        this.calendar = calendar;
        this.config = config;
    }

    /**
     * Crea un evento en Google Calendar cuando se agenda un turno
     */
    public String createEvent(Turno turno) {
        if (!config.isCalendarEnabled() || calendar == null) {
            log.info("Google Calendar deshabilitado, evento no creado");
            return null;
        }

        try {
            Event event = buildEventFromTurno(turno);
            Event createdEvent = calendar.events().insert(calendarId, event).execute();
            
            log.info("✅ Evento creado en Google Calendar: {} (start={})",
                createdEvent.getId(), createdEvent.getStart().getDateTime());
            
            return createdEvent.getId();
            
        } catch (Exception e) {
            log.error("Error al crear evento en Google Calendar", e);
            return null;
        }
    }

    /**
     * Actualiza un evento existente en Google Calendar
     */
    public void updateEvent(Turno turno) {
        if (!config.isCalendarEnabled() || calendar == null || turno.getGoogleEventId() == null) {
            return;
        }

        try {
            Event event = buildEventFromTurno(turno);
            calendar.events().update(calendarId, turno.getGoogleEventId(), event).execute();
            
            log.info("Evento actualizado en Google Calendar: {}", turno.getGoogleEventId());
            
        } catch (Exception e) {
            log.error("Error al actualizar evento en Google Calendar", e);
        }
    }

    /**
     * Elimina un evento de Google Calendar
     */
    public void deleteEvent(String googleEventId) {
        if (!config.isCalendarEnabled() || calendar == null || googleEventId == null) {
            return;
        }

        try {
            calendar.events().delete(calendarId, googleEventId).execute();
            log.info("Evento eliminado de Google Calendar: {}", googleEventId);
            
        } catch (Exception e) {
            log.error("Error al eliminar evento de Google Calendar", e);
        }
    }

    /**
     * Construye un objeto Event de Google Calendar desde un Turno
     */
    private Event buildEventFromTurno(Turno turno) {
        LocalDateTime startDateTime = LocalDateTime.of(turno.getFecha(), turno.getHora());
        LocalDateTime endDateTime = startDateTime.plusMinutes(60);

        // ESTRATEGIA: enviar la hora local de Buenos Aires como si fuera UTC.
        // El Google Calendar del usuario está configurado en zona horaria UTC/GMT.
        // Si enviamos 09:00Z, Google muestra "09:00" en su calendario UTC → correcto.
        // Si hiciéramos la conversión real (09:00 BA = 12:00 UTC), Google mostraría
        // "12:00" → el usuario vería +3 horas de diferencia.
        long startMillis = startDateTime.toInstant(ZoneOffset.UTC).toEpochMilli();
        long endMillis   = endDateTime.toInstant(ZoneOffset.UTC).toEpochMilli();

        DateTime startGoogleDt = new DateTime(startMillis);
        DateTime endGoogleDt   = new DateTime(endMillis);

        log.info("📅 Evento GCal: turno={} → enviado como '{}' (hora local como UTC)",
                startDateTime, startGoogleDt);

        // NO usar setTimeZone() — el calendario del usuario está en UTC,
        // y queremos que Google muestre el valor numérico tal cual.
        Event event = new Event()
                .setSummary("Turno: " + turno.getPaciente().getNombre())
                .setDescription(buildEventDescription(turno))
                .setLocation("Consultorio Integral Psique")
                .setStart(new EventDateTime().setDateTime(startGoogleDt))
                .setEnd(new EventDateTime().setDateTime(endGoogleDt));

        // Configurar recordatorios
        EventReminder[] reminderOverrides = new EventReminder[] {
                new EventReminder().setMethod("email").setMinutes(24 * 60), // 1 día antes
                new EventReminder().setMethod("popup").setMinutes(60)       // 1 hora antes
        };
        Event.Reminders reminders = new Event.Reminders()
                .setUseDefault(false)
                .setOverrides(Arrays.asList(reminderOverrides));
        event.setReminders(reminders);

        // Color: azul para turnos confirmados
        if ("confirmado".equals(turno.getEstado())) {
            event.setColorId("9"); // Azul
        }

        return event;
    }

    /**
     * Construye la descripción del evento
     */
    private String buildEventDescription(Turno turno) {
        StringBuilder description = new StringBuilder();
        description.append("📋 TURNO CONSULTORIO PSIQUE\n\n");
        description.append("👤 Paciente: ").append(turno.getPaciente().getNombre()).append("\n");
        description.append("👨‍⚕️ Profesional: ").append(turno.getProfesional().getNombre()).append("\n");
        description.append("📱 Teléfono: ").append(turno.getPaciente().getTelefono()).append("\n");
        
        if (turno.getPaciente().getEmail() != null) {
            description.append("📧 Email: ").append(turno.getPaciente().getEmail()).append("\n");
        }
        
        if (turno.getPaciente().getMotivo() != null && !turno.getPaciente().getMotivo().isEmpty()) {
            description.append("\n💬 Motivo de consulta:\n").append(turno.getPaciente().getMotivo());
        }
        
        if (turno.getModalidad() != null) {
            String iconoModalidad = "virtual".equalsIgnoreCase(turno.getModalidad()) ? "💻" : "🏢";
            description.append("\n").append(iconoModalidad).append(" Modalidad: ").append(turno.getModalidad().substring(0, 1).toUpperCase() + turno.getModalidad().substring(1));
        }
        description.append("\n\n⏰ Duración estimada: 60 minutos");
        
        return description.toString();
    }
}
