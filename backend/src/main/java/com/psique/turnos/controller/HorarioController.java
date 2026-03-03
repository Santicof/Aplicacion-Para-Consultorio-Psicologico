package com.psique.turnos.controller;

import com.psique.turnos.service.ProfesionalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/horarios-disponibles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HorarioController {

    private final ProfesionalService profesionalService;
    private final com.psique.turnos.service.TurnoService turnoService;
    private final com.psique.turnos.service.HorarioBloqueadoService horarioBloqueadoService;
    private final com.psique.turnos.service.PacienteFijoService pacienteFijoService;

    @GetMapping("/{profesionalId}/{fecha}")
    @Transactional
    public ResponseEntity<Map<String, List<String>>> obtenerDisponibilidad(
            @PathVariable Long profesionalId,
            @PathVariable String fecha) {
        
        var profesional = profesionalService.obtenerPorId(profesionalId)
                .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));
        
        // Horas ocupadas por turnos existentes (getHora() ya devuelve String "HH:mm")
        var turnosOcupados = turnoService.obtenerPorProfesionalYFecha(profesionalId, fecha)
                .stream()
                .map(t -> t.getHora())
                .collect(Collectors.toSet());

        // Horas bloqueadas (vacaciones, ocupado, etc.)
        var horasBloqueadas = horarioBloqueadoService.obtenerHorasBloqueadasParaFecha(profesionalId, fecha);

        // Horas ocupadas por pacientes fijos (turnos recurrentes semanales)
        var horasPacientesFijos = pacienteFijoService.obtenerHorasOcupadasParaFecha(profesionalId, LocalDate.parse(fecha));

        // SIEMPRE generar franja horaria completa 08:00 - 19:00
        List<String> todasLasHoras = new ArrayList<>();
        for (int h = 8; h <= 19; h++) {
            todasLasHoras.add(String.format("%02d:00", h));
        }
        java.util.Collections.sort(todasLasHoras);

        List<String> disponibles = todasLasHoras.stream()
                .filter(h -> !turnosOcupados.contains(h) && !horasBloqueadas.contains(h) && !horasPacientesFijos.contains(h))
                .collect(Collectors.toList());
        
        List<String> ocupados = todasLasHoras.stream()
                .filter(h -> turnosOcupados.contains(h) || horasBloqueadas.contains(h) || horasPacientesFijos.contains(h))
                .collect(Collectors.toList());
        
        Map<String, List<String>> resultado = new HashMap<>();
        resultado.put("disponibles", disponibles);
        resultado.put("ocupados", ocupados);
        
        return ResponseEntity.ok(resultado);
    }
}
