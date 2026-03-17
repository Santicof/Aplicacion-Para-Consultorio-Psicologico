package com.psique.turnos.controller;

import com.psique.turnos.model.DiasSemanaNoLaborables;
import com.psique.turnos.service.DiasSemanaNoLaborablesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dias-no-laborables/dias-semana")
@RequiredArgsConstructor
public class DiasSemanaNoLaborablesController {
    private final DiasSemanaNoLaborablesService service;
    private final DiaNoLaborableController diaNoLaborableController;

    @GetMapping
    public ResponseEntity<DiasSemanaNoLaborables> obtener() {
        List<DiasSemanaNoLaborables> lista = service.obtenerTodos();
        DiasSemanaNoLaborables entity = lista.isEmpty() ? new DiasSemanaNoLaborables() : lista.get(0);
        return ResponseEntity.ok(entity);
    }

    @DeleteMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetear() {
        service.eliminarTodos();
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("diasSemana", List.of());
        resultado.put("fechasEspecificas", List.of());
        return ResponseEntity.ok(resultado);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> actualizar(@RequestBody Map<String, List<String>> body) {
        List<String> diasSemana = body.get("diasSemana");
        service.actualizarDiasSemana(diasSemana);
        // Reutilizar lógica del controlador principal
        return diaNoLaborableController.obtenerTodos();
    }
}
