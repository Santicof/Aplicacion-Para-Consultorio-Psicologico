package com.psique.turnos.controller;

import com.psique.turnos.service.ProfesionalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/horarios-disponibles")
@RequiredArgsConstructor
public class HorarioController {

    private final ProfesionalService profesionalService;
    private final com.psique.turnos.service.TurnoService turnoService;
    private final com.psique.turnos.service.HorarioBloqueadoService horarioBloqueadoService;
    private final com.psique.turnos.service.PacienteFijoService pacienteFijoService;
    private final com.psique.turnos.service.DiaNoLaborableService diaNoLaborableService;
    private final com.psique.turnos.service.DiasSemanaNoLaborablesService diasSemanaNoLaborablesService;

    // Mapeo de DayOfWeek (Java) a nombre español usado en horarios del profesional
    private static final Map<DayOfWeek, String> DIA_ESPANOL = Map.of(
        DayOfWeek.MONDAY, "LUNES",
        DayOfWeek.TUESDAY, "MARTES",
        DayOfWeek.WEDNESDAY, "MIÉRCOLES",
        DayOfWeek.THURSDAY, "JUEVES",
        DayOfWeek.FRIDAY, "VIERNES",
        DayOfWeek.SATURDAY, "SÁBADO"
    );

    @GetMapping("/{profesionalId}/{fecha}")
    @Transactional
    public ResponseEntity<Map<String, List<String>>> obtenerDisponibilidad(
            @PathVariable Long profesionalId,
            @PathVariable String fecha) {
        
        var profesional = profesionalService.obtenerPorId(profesionalId)
                .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));

        LocalDate localDate = LocalDate.parse(fecha);
        
        // Si es domingo, nunca hay disponibilidad
        if (localDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return ResponseEntity.ok(Map.of("disponibles", new ArrayList<>(), "ocupados", new ArrayList<>()));
        }

        // Verificar si el día es no laborable
        var diasNoLaborables = diaNoLaborableService.obtenerPorFecha(fecha);
        var diasSemanaNoLaborables = diasSemanaNoLaborablesService.obtenerTodos();
        String diaSemana = localDate.getDayOfWeek().name();
        boolean esDiaSemanaNoLaborable = !diasSemanaNoLaborables.isEmpty() 
            && diasSemanaNoLaborables.get(0).getDiasSemana() != null 
            && diasSemanaNoLaborables.get(0).getDiasSemana().contains(diaSemana);
        if (!diasNoLaborables.isEmpty() || esDiaSemanaNoLaborable) {
            Map<String, List<String>> resultado = new HashMap<>();
            resultado.put("disponibles", new ArrayList<>());
            resultado.put("ocupados", new ArrayList<>());
            return ResponseEntity.ok(resultado);
        }

        // Verificar si el profesional tiene horarios definidos
        var horariosProfesional = profesional.getHorarios();
        String diaEspanol = DIA_ESPANOL.get(localDate.getDayOfWeek());
        
        List<String> horasDelDia = new ArrayList<>();
        
        if (horariosProfesional != null && !horariosProfesional.isEmpty()) {
            // Verificar si los horarios tienen formato por día ("LUNES:09:00-18:00") 
            // o formato simple de horas ("09:00", "10:00", ...)
            boolean tieneFormatoPorDia = horariosProfesional.stream()
                .anyMatch(h -> h.contains(":") && DIA_ESPANOL.values().stream().anyMatch(d -> h.startsWith(d + ":")));
            
            if (tieneFormatoPorDia) {
                // Formato: "LUNES:09:00-18:00"
                String horarioDelDia = horariosProfesional.stream()
                    .filter(h -> h.startsWith(diaEspanol + ":"))
                    .findFirst()
                    .orElse(null);
                
                if (horarioDelDia == null) {
                    // El profesional NO trabaja este día
                    Map<String, List<String>> resultado = new HashMap<>();
                    resultado.put("disponibles", new ArrayList<>());
                    resultado.put("ocupados", new ArrayList<>());
                    resultado.put("profesionalNoDisponible", List.of("true"));
                    return ResponseEntity.ok(resultado);
                }
                
                // Extraer horas de inicio y fin
                try {
                    String horaParte = horarioDelDia.substring(diaEspanol.length() + 1);
                    String[] partes = horaParte.split("-");
                    int horaInicio = Integer.parseInt(partes[0].split(":")[0]);
                    int horaFin = Integer.parseInt(partes[1].split(":")[0]);
                    for (int h = horaInicio; h < horaFin; h++) {
                        horasDelDia.add(String.format("%02d:00", h));
                    }
                } catch (Exception e) {
                    for (int h = 8; h < 19; h++) {
                        horasDelDia.add(String.format("%02d:00", h));
                    }
                }
            } else {
                // Formato simple: ["08:00", "09:00", "10:00", ...]
                // Estas horas aplican a todos los días laborables (lun-sáb)
                horasDelDia.addAll(horariosProfesional);
            }
        } else {
            // Sin horarios definidos, usar horario por defecto 8-19
            for (int h = 8; h < 19; h++) {
                horasDelDia.add(String.format("%02d:00", h));
            }
        }
        
        if (horasDelDia.isEmpty()) {
            Map<String, List<String>> resultado = new HashMap<>();
            resultado.put("disponibles", new ArrayList<>());
            resultado.put("ocupados", new ArrayList<>());
            resultado.put("profesionalNoDisponible", List.of("true"));
            return ResponseEntity.ok(resultado);
        }

        // Horas ocupadas por turnos existentes
        var turnosOcupados = turnoService.obtenerPorProfesionalYFecha(profesionalId, fecha)
                .stream()
                .map(t -> t.getHora())
                .collect(Collectors.toSet());

        // Horas bloqueadas (vacaciones, ocupado, etc.)
        var horasBloqueadas = horarioBloqueadoService.obtenerHorasBloqueadasParaFecha(profesionalId, fecha);

        // Horas ocupadas por pacientes fijos (turnos recurrentes semanales)
        var horasPacientesFijos = pacienteFijoService.obtenerHorasOcupadasParaFecha(profesionalId, LocalDate.parse(fecha));

        // Usar las horas del día ya calculadas
        List<String> disponibles = horasDelDia.stream()
                .filter(h -> !turnosOcupados.contains(h) && !horasBloqueadas.contains(h) && !horasPacientesFijos.contains(h))
                .collect(Collectors.toList());
        
        List<String> ocupados = horasDelDia.stream()
                .filter(h -> turnosOcupados.contains(h) || horasBloqueadas.contains(h) || horasPacientesFijos.contains(h))
                .collect(Collectors.toList());
        
        Map<String, List<String>> resultado = new HashMap<>();
        resultado.put("disponibles", disponibles);
        resultado.put("ocupados", ocupados);
        
        return ResponseEntity.ok(resultado);
    }
}
