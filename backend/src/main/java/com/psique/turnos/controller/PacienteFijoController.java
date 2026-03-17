package com.psique.turnos.controller;

import com.psique.turnos.dto.PacienteFijoDTO;
import com.psique.turnos.service.PacienteFijoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/pacientes-fijos")
@RequiredArgsConstructor
public class PacienteFijoController {

    private final PacienteFijoService pacienteFijoService;

    @PostMapping
    public ResponseEntity<PacienteFijoDTO> crear(@RequestBody PacienteFijoDTO dto) {
        try {
            log.info("📝 Recibiendo solicitud para crear paciente fijo: {}", dto);
            PacienteFijoDTO created = pacienteFijoService.crear(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("❌ Error al crear paciente fijo", e);
            throw e;
        }
    }

    @GetMapping
    public ResponseEntity<List<PacienteFijoDTO>> obtenerTodos() {
        return ResponseEntity.ok(pacienteFijoService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PacienteFijoDTO> obtenerPorId(@PathVariable Long id) {
        return pacienteFijoService.obtenerPorId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/profesional/{profesionalId}")
    public ResponseEntity<List<PacienteFijoDTO>> obtenerPorProfesional(@PathVariable Long profesionalId) {
        return ResponseEntity.ok(pacienteFijoService.obtenerPorProfesional(profesionalId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PacienteFijoDTO> actualizar(
            @PathVariable Long id,
            @RequestBody PacienteFijoDTO dto) {
        return pacienteFijoService.actualizar(id, dto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        try {
            pacienteFijoService.eliminar(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
