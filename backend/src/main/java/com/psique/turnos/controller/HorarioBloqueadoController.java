package com.psique.turnos.controller;

import com.psique.turnos.dto.HorarioBloqueadoDTO;
import com.psique.turnos.service.HorarioBloqueadoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/horarios-bloqueados")
@RequiredArgsConstructor
public class HorarioBloqueadoController {

    private final HorarioBloqueadoService horarioBloqueadoService;

    @PostMapping
    public ResponseEntity<HorarioBloqueadoDTO> crear(@RequestBody HorarioBloqueadoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(horarioBloqueadoService.crear(dto));
    }

    @PostMapping("/bloquear-dia-completo")
    public ResponseEntity<HorarioBloqueadoDTO> bloquearDiaCompleto(
            @RequestParam Long profesionalId,
            @RequestParam String fecha,
            @RequestParam String motivo,
            @RequestParam(required = false) String descripcion) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(horarioBloqueadoService.bloquearDiaCompleto(profesionalId, fecha, motivo, descripcion));
    }

    @GetMapping("/profesional/{profesionalId}/fecha/{fecha}")
    public ResponseEntity<List<HorarioBloqueadoDTO>> obtenerPorProfesionalYFecha(
            @PathVariable Long profesionalId,
            @PathVariable String fecha) {
        return ResponseEntity.ok(horarioBloqueadoService.obtenerPorProfesionalYFecha(profesionalId, fecha));
    }

    @GetMapping("/profesional/{profesionalId}/rango")
    public ResponseEntity<List<HorarioBloqueadoDTO>> obtenerPorProfesionalYRango(
            @PathVariable Long profesionalId,
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        return ResponseEntity.ok(
            horarioBloqueadoService.obtenerPorProfesionalYRango(profesionalId, fechaInicio, fechaFin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        horarioBloqueadoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
