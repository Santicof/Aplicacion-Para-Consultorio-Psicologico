package com.psique.turnos.service;

import com.psique.turnos.dto.PacienteFijoDTO;
import com.psique.turnos.model.PacienteFijo;
import com.psique.turnos.model.Profesional;
import com.psique.turnos.repository.PacienteFijoRepository;
import com.psique.turnos.repository.ProfesionalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PacienteFijoService {

    private final PacienteFijoRepository pacienteFijoRepository;
    private final ProfesionalRepository profesionalRepository;
    private final GoogleCalendarService googleCalendarService;

    @Transactional
    public PacienteFijoDTO crear(PacienteFijoDTO dto) {
        Profesional profesional = profesionalRepository.findById(dto.getProfesionalId())
            .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));

        PacienteFijo pacienteFijo = new PacienteFijo();
        pacienteFijo.setProfesional(profesional);
        pacienteFijo.setNombrePaciente(dto.getNombrePaciente());
        
        // Convertir lista de strings a lista de enums
        List<PacienteFijo.DiaSemana> diasEnum = dto.getDiasSemana().stream()
            .map(dia -> PacienteFijo.DiaSemana.valueOf(dia.toUpperCase()))
            .collect(Collectors.toList());
        pacienteFijo.setDiasSemana(diasEnum);
        
        pacienteFijo.setHora(dto.getHora());
        pacienteFijo.setModalidad(dto.getModalidad());
        pacienteFijo.setObservaciones(dto.getObservaciones());

        PacienteFijo guardado = pacienteFijoRepository.save(pacienteFijo);
        log.info("📅 Paciente fijo creado: {} - {} cada {}", 
            guardado.getNombrePaciente(), guardado.getHora(), guardado.getDiasSemana());

        // Sincronizar con Google Calendar
        try {
            String eventId = googleCalendarService.crearEventoRecurrente(guardado);
            guardado.setGoogleEventId(eventId);
            guardado = pacienteFijoRepository.save(guardado);
            log.info("✅ Evento recurrente creado en Google Calendar: {}", eventId);
        } catch (Exception e) {
            log.error("❌ Error al crear evento recurrente en Google Calendar", e);
        }

        return convertirADTO(guardado);
    }

    @Transactional
    public Optional<PacienteFijoDTO> actualizar(Long id, PacienteFijoDTO dto) {
        // Validar que haya al menos un día seleccionado
        if (dto.getDiasSemana() == null || dto.getDiasSemana().isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos un día de la semana");
        }
        
        return pacienteFijoRepository.findById(id)
            .map(pacienteFijo -> {
                Profesional profesional = profesionalRepository.findById(dto.getProfesionalId())
                    .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));

                pacienteFijo.setProfesional(profesional);
                pacienteFijo.setNombrePaciente(dto.getNombrePaciente());
                
                // Convertir lista de strings a lista de enums
                List<PacienteFijo.DiaSemana> diasEnum = dto.getDiasSemana().stream()
                    .map(dia -> PacienteFijo.DiaSemana.valueOf(dia.toUpperCase()))
                    .collect(Collectors.toList());
                pacienteFijo.setDiasSemana(diasEnum);
                
                pacienteFijo.setHora(dto.getHora());
                pacienteFijo.setModalidad(dto.getModalidad());
                pacienteFijo.setObservaciones(dto.getObservaciones());

                PacienteFijo actualizado = pacienteFijoRepository.save(pacienteFijo);

                // Actualizar evento en Google Calendar
                try {
                    if (actualizado.getGoogleEventId() != null) {
                        googleCalendarService.actualizarEventoRecurrente(actualizado);
                        log.info("✅ Evento recurrente actualizado en Google Calendar");
                    } else {
                        String eventId = googleCalendarService.crearEventoRecurrente(actualizado);
                        actualizado.setGoogleEventId(eventId);
                        actualizado = pacienteFijoRepository.save(actualizado);
                        log.info("✅ Evento recurrente creado en Google Calendar");
                    }
                } catch (Exception e) {
                    log.error("❌ Error al actualizar evento en Google Calendar", e);
                }

                return convertirADTO(actualizado);
            });
    }

    @Transactional
    public void eliminar(Long id) {
        pacienteFijoRepository.findById(id).ifPresent(pacienteFijo -> {
            // Eliminar de Google Calendar
            try {
                if (pacienteFijo.getGoogleEventId() != null) {
                    googleCalendarService.eliminarEventoRecurrente(pacienteFijo.getGoogleEventId());
                    log.info("✅ Evento recurrente eliminado de Google Calendar");
                }
            } catch (Exception e) {
                log.error("❌ Error al eliminar evento de Google Calendar", e);
            }

            pacienteFijoRepository.deleteById(id);
            log.info("🗑️ Paciente fijo eliminado: {}", pacienteFijo.getNombrePaciente());
        });
    }

    public List<PacienteFijoDTO> obtenerTodos() {
        return pacienteFijoRepository.findAll().stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }

    public List<PacienteFijoDTO> obtenerPorProfesional(Long profesionalId) {
        return pacienteFijoRepository.findByProfesionalId(profesionalId).stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }

    public Optional<PacienteFijoDTO> obtenerPorId(Long id) {
        return pacienteFijoRepository.findById(id)
            .map(this::convertirADTO);
    }

    /**
     * Obtiene los horarios ocupados por pacientes fijos para una fecha específica
     */
    public List<String> obtenerHorasOcupadasParaFecha(Long profesionalId, LocalDate fecha) {
        DayOfWeek diaSemana = fecha.getDayOfWeek();
        PacienteFijo.DiaSemana diaEnum = convertirDayOfWeekADiaSemana(diaSemana);

        return pacienteFijoRepository.findByProfesionalId(profesionalId).stream()
            .filter(pf -> pf.getDiasSemana() != null && pf.getDiasSemana().contains(diaEnum))
            .map(PacienteFijo::getHora)
            .collect(Collectors.toList());
    }

    private PacienteFijoDTO convertirADTO(PacienteFijo pacienteFijo) {
        PacienteFijoDTO dto = new PacienteFijoDTO();
        dto.setId(pacienteFijo.getId());
        dto.setProfesionalId(pacienteFijo.getProfesional().getId());
        dto.setNombreProfesional(pacienteFijo.getProfesional().getNombre());
        dto.setNombrePaciente(pacienteFijo.getNombrePaciente());
        
        // Convertir lista de enums a lista de strings
        List<String> diasString = pacienteFijo.getDiasSemana().stream()
            .map(Enum::name)
            .collect(Collectors.toList());
        dto.setDiasSemana(diasString);
        
        dto.setHora(pacienteFijo.getHora());
        dto.setModalidad(pacienteFijo.getModalidad());
        dto.setObservaciones(pacienteFijo.getObservaciones());
        dto.setGoogleEventId(pacienteFijo.getGoogleEventId());
        return dto;
    }

    private PacienteFijo.DiaSemana convertirDayOfWeekADiaSemana(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> PacienteFijo.DiaSemana.LUNES;
            case TUESDAY -> PacienteFijo.DiaSemana.MARTES;
            case WEDNESDAY -> PacienteFijo.DiaSemana.MIERCOLES;
            case THURSDAY -> PacienteFijo.DiaSemana.JUEVES;
            case FRIDAY -> PacienteFijo.DiaSemana.VIERNES;
            case SATURDAY -> PacienteFijo.DiaSemana.SABADO;
            case SUNDAY -> PacienteFijo.DiaSemana.DOMINGO;
        };
    }
}
