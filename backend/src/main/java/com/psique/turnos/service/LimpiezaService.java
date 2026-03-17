package com.psique.turnos.service;

import com.psique.turnos.model.HorarioBloqueado;
import com.psique.turnos.model.Turno;
import com.psique.turnos.repository.HorarioBloqueadoRepository;
import com.psique.turnos.repository.TurnoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class LimpiezaService {

    private final TurnoRepository turnoRepository;
    private final HorarioBloqueadoRepository horarioBloqueadoRepository;

    // Turnos con más de 90 días de antigüedad
    private static final int DIAS_RETENCION_TURNOS = 90;
    // Bloqueos con más de 30 días de antigüedad
    private static final int DIAS_RETENCION_BLOQUEOS = 30;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Obtiene una vista previa de los datos que se eliminarían
     */
    public Map<String, Object> preview() {
        LocalDate fechaLimiteTurnos = LocalDate.now().minusDays(DIAS_RETENCION_TURNOS);
        LocalDate fechaLimiteBloqueos = LocalDate.now().minusDays(DIAS_RETENCION_BLOQUEOS);

        List<Turno> turnosAntiguos = turnoRepository.findAll().stream()
                .filter(t -> t.getFecha() != null && t.getFecha().isBefore(fechaLimiteTurnos))
                .toList();

        List<HorarioBloqueado> bloqueosAntiguos = horarioBloqueadoRepository.findAll().stream()
                .filter(b -> b.getFecha() != null && b.getFecha().isBefore(fechaLimiteBloqueos))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("turnosAEliminar", turnosAntiguos.size());
        result.put("bloqueosAEliminar", bloqueosAntiguos.size());
        result.put("fechaLimiteTurnos", fechaLimiteTurnos.format(DATE_FORMATTER));
        result.put("fechaLimiteBloqueos", fechaLimiteBloqueos.format(DATE_FORMATTER));
        result.put("diasRetencionTurnos", DIAS_RETENCION_TURNOS);
        result.put("diasRetencionBloqueos", DIAS_RETENCION_BLOQUEOS);

        return result;
    }

    /**
     * Ejecuta la limpieza eliminando turnos y bloqueos antiguos
     */
    @Transactional
    public Map<String, Object> ejecutar() {
        LocalDate fechaLimiteTurnos = LocalDate.now().minusDays(DIAS_RETENCION_TURNOS);
        LocalDate fechaLimiteBloqueos = LocalDate.now().minusDays(DIAS_RETENCION_BLOQUEOS);

        // Eliminar turnos antiguos
        List<Turno> turnosAntiguos = turnoRepository.findAll().stream()
                .filter(t -> t.getFecha() != null && t.getFecha().isBefore(fechaLimiteTurnos))
                .toList();
        turnoRepository.deleteAll(turnosAntiguos);
        log.info("🗑️ Eliminados {} turnos anteriores a {}", turnosAntiguos.size(), fechaLimiteTurnos);

        // Eliminar bloqueos antiguos
        List<HorarioBloqueado> bloqueosAntiguos = horarioBloqueadoRepository.findAll().stream()
                .filter(b -> b.getFecha() != null && b.getFecha().isBefore(fechaLimiteBloqueos))
                .toList();
        horarioBloqueadoRepository.deleteAll(bloqueosAntiguos);
        log.info("🗑️ Eliminados {} bloqueos anteriores a {}", bloqueosAntiguos.size(), fechaLimiteBloqueos);

        Map<String, Object> result = new HashMap<>();
        result.put("turnosEliminados", turnosAntiguos.size());
        result.put("bloqueosEliminados", bloqueosAntiguos.size());
        result.put("fechaLimiteTurnos", fechaLimiteTurnos.format(DATE_FORMATTER));
        result.put("fechaLimiteBloqueos", fechaLimiteBloqueos.format(DATE_FORMATTER));

        return result;
    }
}
