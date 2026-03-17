package com.psique.turnos.controller;

import com.psique.turnos.model.DiaNoLaborable;
import com.psique.turnos.model.DiasSemanaNoLaborables;
import com.psique.turnos.service.DiaNoLaborableService;
import com.psique.turnos.service.DiasSemanaNoLaborablesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dias-no-laborables")
@RequiredArgsConstructor
public class DiaNoLaborableController {
    private final DiaNoLaborableService service;
    private final DiasSemanaNoLaborablesService diasSemanaService;

    // Endpoint unificado que retorna días de la semana y fechas bloqueadas
    @GetMapping
    public ResponseEntity<Map<String, Object>> obtenerTodos() {
        List<DiasSemanaNoLaborables> diasSemanaList = diasSemanaService.obtenerTodos();
        List<String> diasSemana = diasSemanaList.isEmpty() ? List.of() : diasSemanaList.get(0).getDiasSemana();
        if (diasSemana == null) diasSemana = List.of();
        
        List<DiaNoLaborable> fechas = service.obtenerTodos();
        List<Map<String, String>> fechasEspecificas = fechas.stream().map(f -> {
            Map<String, String> m = new HashMap<>();
            m.put("fecha", f.getFecha());
            m.put("descripcion", f.getMotivo());
            return m;
        }).collect(Collectors.toList());
        
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("diasSemana", diasSemana);
        resultado.put("fechasEspecificas", fechasEspecificas);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{fecha}")
    public ResponseEntity<List<DiaNoLaborable>> obtenerPorFecha(@PathVariable String fecha) {
        return ResponseEntity.ok(service.obtenerPorFecha(fecha));
    }

    @PostMapping
    public ResponseEntity<DiaNoLaborable> crear(@RequestBody DiaNoLaborable dia) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(dia));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // Endpoint para agregar fecha bloqueada
    @PostMapping("/fechas")
    public ResponseEntity<Map<String, Object>> agregarFecha(@RequestBody Map<String, String> body) {
        DiaNoLaborable dia = new DiaNoLaborable();
        dia.setFecha(body.get("fecha"));
        dia.setMotivo(body.get("descripcion"));
        service.crear(dia);
        return obtenerTodos();
    }

    // Endpoint para eliminar fecha bloqueada
    @DeleteMapping("/fechas/{fecha}")
    public ResponseEntity<Map<String, Object>> eliminarFecha(@PathVariable String fecha) {
        List<DiaNoLaborable> fechas = service.obtenerPorFecha(fecha);
        for (DiaNoLaborable f : fechas) {
            service.eliminar(f.getId());
        }
        return obtenerTodos();
    }
}
