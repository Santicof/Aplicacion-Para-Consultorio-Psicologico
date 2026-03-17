package com.psique.turnos.service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventReminder;
import com.psique.turnos.config.GoogleCalendarConfig;
import com.psique.turnos.model.Turno;
import com.psique.turnos.model.PacienteFijo;
import com.psique.turnos.model.Profesional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class GoogleCalendarService {

    private final GoogleCalendarConfig config;

    @Value("${google.calendar.id:primary}")
    private String calendarId;

    @Value("${google.calendar.timezone:America/Argentina/Buenos_Aires}")
    private String timezone;

    @Autowired
    public GoogleCalendarService(GoogleCalendarConfig config) {
        this.config = config;
    }

    private Calendar getCalendar() {
        return config.getCalendarService();
    }

    /**
     * Crea un evento en Google Calendar cuando se agenda un turno
     */
    public String createEvent(Turno turno) {
        Calendar calendar = getCalendar();
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
        Calendar calendar = getCalendar();
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
        Calendar calendar = getCalendar();
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

        // Asignar color según el profesional (cada profesional tiene su color distintivo)
        String colorId = getColorIdForProfesional(turno.getProfesional());
        event.setColorId(colorId);

        return event;
    }

    /**
     * Obtiene el ID de color de Google Calendar para un profesional específico
     * Usa el color configurado en la entidad Profesional
     */
    private String getColorIdForProfesional(Profesional profesional) {
        if (profesional != null && profesional.getColorCalendario() != null && !profesional.getColorCalendario().isEmpty()) {
            return profesional.getColorCalendario();
        }
        return "9"; // Color por defecto: Arándano (Azul)
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

    /**
     * Crea un evento recurrente en Google Calendar para un paciente fijo
     */
    public String crearEventoRecurrente(PacienteFijo pacienteFijo) {
        log.info("🔄 Intentando crear evento recurrente para: {}", pacienteFijo.getNombrePaciente());
        
        if (!config.isCalendarEnabled()) {
            log.warn("⚠️ Google Calendar está DESHABILITADO en la configuración");
            return null;
        }
        
        Calendar calendar = getCalendar();
        if (calendar == null) {
            log.error("❌ El objeto Calendar es NULL - La integración con Google Calendar no está inicializada");
            log.error("❌ Verifique las credenciales y tokens de autenticación");
            return null;
        }

        try {
            log.info("📅 Construyendo evento recurrente para: {}", pacienteFijo.getNombrePaciente());
            Event event = buildEventFromPacienteFijo(pacienteFijo);
            
            log.info("📤 Enviando evento a Google Calendar...");
            Event createdEvent = calendar.events().insert(calendarId, event).execute();
            
            log.info("✅ Evento recurrente creado exitosamente en Google Calendar!");
            log.info("   ID: {}", createdEvent.getId());
            log.info("   Paciente: {}", pacienteFijo.getNombrePaciente());
            log.info("   Días: {}", pacienteFijo.getDiasSemana());
            
            return createdEvent.getId();
            
        } catch (Exception e) {
            log.error("❌ ERROR al crear evento recurrente en Google Calendar", e);
            log.error("   Paciente: {}", pacienteFijo.getNombrePaciente());
            log.error("   Tipo de error: {}", e.getClass().getName());
            log.error("   Mensaje: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Actualiza un evento recurrente existente en Google Calendar
     */
    public void actualizarEventoRecurrente(PacienteFijo pacienteFijo) {
        Calendar calendar = getCalendar();
        if (!config.isCalendarEnabled() || calendar == null || pacienteFijo.getGoogleEventId() == null) {
            return;
        }

        try {
            Event event = buildEventFromPacienteFijo(pacienteFijo);
            calendar.events().update(calendarId, pacienteFijo.getGoogleEventId(), event).execute();
            
            log.info("✅ Evento recurrente actualizado en Google Calendar: {}", pacienteFijo.getGoogleEventId());
            
        } catch (Exception e) {
            log.error("Error al actualizar evento recurrente en Google Calendar", e);
        }
    }

    /**
     * Elimina un evento recurrente de Google Calendar
     */
    public void eliminarEventoRecurrente(String googleEventId) {
        deleteEvent(googleEventId); // Reutilizar el método de eliminación existente
    }

    /**
     * Construye un objeto Event recurrente de Google Calendar desde un PacienteFijo
     */
    private Event buildEventFromPacienteFijo(PacienteFijo pacienteFijo) {
        // Validar que haya días seleccionados
        if (pacienteFijo.getDiasSemana() == null || pacienteFijo.getDiasSemana().isEmpty()) {
            throw new IllegalArgumentException("El paciente fijo debe tener al menos un día asignado");
        }
        
        // Encontrar la próxima ocurrencia del primer día de la semana
        LocalDate proximaFecha = encontrarProximaOcurrencia(pacienteFijo.getDiasSemana().get(0));
        LocalTime hora = LocalTime.parse(pacienteFijo.getHora());
        LocalDateTime startDateTime = LocalDateTime.of(proximaFecha, hora);
        LocalDateTime endDateTime = startDateTime.plusMinutes(60);

        // Para eventos recurrentes, Google Calendar requiere zona horaria explícita
        // Usar formato RFC3339 con zona horaria de Buenos Aires
        String timeZone = "America/Argentina/Buenos_Aires";
        
        // Formatear fecha/hora en formato RFC3339 (ISO 8601)
        String startStr = startDateTime.toString() + ":00";
        String endStr = endDateTime.toString() + ":00";
        
        DateTime startGoogleDt = new DateTime(startStr);
        DateTime endGoogleDt = new DateTime(endStr);

        log.info("📅 Evento Recurrente GCal: {} cada {} → enviado como '{}' (zona: {})",
                pacienteFijo.getNombrePaciente(), pacienteFijo.getDiasSemana(), startGoogleDt, timeZone);

        Event event = new Event()
                .setSummary("🔁 Turno Fijo: " + pacienteFijo.getNombrePaciente())
                .setDescription(buildEventDescriptionFromPacienteFijo(pacienteFijo))
                .setLocation("Consultorio Integral Psique")
                .setStart(new EventDateTime().setDateTime(startGoogleDt).setTimeZone(timeZone))
                .setEnd(new EventDateTime().setDateTime(endGoogleDt).setTimeZone(timeZone))
                .setRecurrence(Arrays.asList(buildRecurrenceRule(pacienteFijo.getDiasSemana())));

        // Configurar recordatorios
        EventReminder[] reminderOverrides = new EventReminder[] {
                new EventReminder().setMethod("popup").setMinutes(60) // 1 hora antes
        };
        Event.Reminders reminders = new Event.Reminders()
                .setUseDefault(false)
                .setOverrides(Arrays.asList(reminderOverrides));
        event.setReminders(reminders);

        // Asignar color según el profesional (mismo color que los turnos normales)
        String colorId = getColorIdForProfesional(pacienteFijo.getProfesional());
        event.setColorId(colorId);

        return event;
    }

    /**
     * Construye la descripción del evento para un paciente fijo
     */
    private String buildEventDescriptionFromPacienteFijo(PacienteFijo pacienteFijo) {
        StringBuilder description = new StringBuilder();
        description.append("📋 TURNO FIJO SEMANAL - CONSULTORIO PSIQUE\n\n");
        description.append("👤 Paciente: ").append(pacienteFijo.getNombrePaciente()).append("\n");
        description.append("👨‍⚕️ Profesional: ").append(pacienteFijo.getProfesional().getNombre()).append("\n");
        
        String diasTexto = pacienteFijo.getDiasSemana().stream()
            .map(dia -> dia.name().toLowerCase())
            .collect(Collectors.joining(", "));
        description.append("📅 Día: ").append(diasTexto).append("\n");
        description.append("🕐 Hora: ").append(pacienteFijo.getHora()).append("\n");
        
        String iconoModalidad = "virtual".equalsIgnoreCase(pacienteFijo.getModalidad()) ? "💻" : "🏢";
        description.append(iconoModalidad).append(" Modalidad: ").append(
            pacienteFijo.getModalidad().substring(0, 1).toUpperCase() + pacienteFijo.getModalidad().substring(1)
        ).append("\n");
        
        if (pacienteFijo.getObservaciones() != null && !pacienteFijo.getObservaciones().isEmpty()) {
            description.append("\n📝 Observaciones:\n").append(pacienteFijo.getObservaciones());
        }
        
        description.append("\n\n⏰ Duración: 60 minutos");
        description.append("\n🔁 Se repite cada ").append(diasTexto);
        
        return description.toString();
    }

    /**
     * Construye la regla de recurrencia RRULE para Google Calendar con múltiples días
     */
    private String buildRecurrenceRule(List<PacienteFijo.DiaSemana> diasSemana) {
        // Convertir cada día a su abreviatura y unirlos con comas
        String diasAbreviados = diasSemana.stream()
            .map(this::convertirDiaSemanaAAbreviatura)
            .collect(Collectors.joining(","));
        return "RRULE:FREQ=WEEKLY;BYDAY=" + diasAbreviados;
    }

    /**
     * Convierte el día de la semana a la abreviatura usada en RRULE
     */
    private String convertirDiaSemanaAAbreviatura(PacienteFijo.DiaSemana diaSemana) {
        return switch (diaSemana) {
            case LUNES -> "MO";
            case MARTES -> "TU";
            case MIERCOLES -> "WE";
            case JUEVES -> "TH";
            case VIERNES -> "FR";
            case SABADO -> "SA";
            case DOMINGO -> "SU";
        };
    }

    /**
     * Encuentra la próxima ocurrencia de un día de la semana
     */
    private LocalDate encontrarProximaOcurrencia(PacienteFijo.DiaSemana diaSemana) {
        LocalDate hoy = LocalDate.now();
        DayOfWeek dayOfWeek = convertirDiaSemanaADayOfWeek(diaSemana);
        
        LocalDate proximaFecha = hoy;
        while (proximaFecha.getDayOfWeek() != dayOfWeek) {
            proximaFecha = proximaFecha.plusDays(1);
        }
        
        return proximaFecha;
    }

    /**
     * Convierte DiaSemana a DayOfWeek de Java
     */
    private DayOfWeek convertirDiaSemanaADayOfWeek(PacienteFijo.DiaSemana diaSemana) {
        return switch (diaSemana) {
            case LUNES -> DayOfWeek.MONDAY;
            case MARTES -> DayOfWeek.TUESDAY;
            case MIERCOLES -> DayOfWeek.WEDNESDAY;
            case JUEVES -> DayOfWeek.THURSDAY;
            case VIERNES -> DayOfWeek.FRIDAY;
            case SABADO -> DayOfWeek.SATURDAY;
            case DOMINGO -> DayOfWeek.SUNDAY;
        };
    }

    public boolean isConnected() {
        return config.isConnected();
    }
}
