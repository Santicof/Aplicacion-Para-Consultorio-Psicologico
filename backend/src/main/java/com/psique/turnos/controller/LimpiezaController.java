package com.psique.turnos.controller;

import com.psique.turnos.service.LimpiezaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/limpieza")
@RequiredArgsConstructor
@Slf4j
public class LimpiezaController {

    private final LimpiezaService limpiezaService;

    @GetMapping("/preview")
    public ResponseEntity<Map<String, Object>> preview() {
        return ResponseEntity.ok(limpiezaService.preview());
    }

    @PostMapping("/ejecutar")
    public ResponseEntity<Map<String, Object>> ejecutar() {
        log.info("🗑️ Ejecutando limpieza de datos antiguos...");
        Map<String, Object> resultado = limpiezaService.ejecutar();
        log.info("✅ Limpieza completada: {} turnos y {} bloqueos eliminados",
                resultado.get("turnosEliminados"), resultado.get("bloqueosEliminados"));
        return ResponseEntity.ok(resultado);
    }
}
