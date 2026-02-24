package com.psique.turnos.controller;

import com.psique.turnos.service.ProfesionalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @GetMapping("/{profesionalId}/{fecha}")
    @Transactional
    public ResponseEntity<Map<String, List<String>>> obtenerDisponibilidad(
            @PathVariable Long profesionalId,
            @PathVariable String fecha) {
        
        var profesional = profesionalService.obtenerPorId(profesionalId)
                .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));
        
        var turnosOcupados = turnoService.obtenerPorProfesionalYFecha(profesionalId, fecha)
                .stream()
                .map(t -> t.getHora())
                .collect(Collectors.toSet());
        
        List<String> disponibles = profesional.getHorarios().stream()
                .filter(h -> !turnosOcupados.contains(h))
                .collect(Collectors.toList());
        
        List<String> ocupados = profesional.getHorarios().stream()
                .filter(turnosOcupados::contains)
                .collect(Collectors.toList());
        
        Map<String, List<String>> resultado = new HashMap<>();
        resultado.put("disponibles", disponibles);
        resultado.put("ocupados", ocupados);
        
        return ResponseEntity.ok(resultado);
    }
}
