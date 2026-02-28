package com.psique.turnos.controller;

import com.psique.turnos.dto.TurnoRequestDTO;
import com.psique.turnos.dto.TurnoResponseDTO;
import com.psique.turnos.service.GoogleCalendarSyncService;
import com.psique.turnos.service.TurnoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/turnos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TurnoController {

    private final TurnoService turnoService;
    private final GoogleCalendarSyncService syncService;

    @GetMapping
    public ResponseEntity<List<TurnoResponseDTO>> obtenerTodos() {
        return ResponseEntity.ok(turnoService.obtenerTodos());
    }

    @GetMapping("/{profesionalId}/{fecha}")
    public ResponseEntity<List<TurnoResponseDTO>> obtenerPorProfesionalYFecha(
            @PathVariable Long profesionalId,
            @PathVariable String fecha) {
        return ResponseEntity.ok(turnoService.obtenerPorProfesionalYFecha(profesionalId, fecha));
    }

    @PostMapping
    public ResponseEntity<TurnoResponseDTO> crearTurno(@Valid @RequestBody TurnoRequestDTO request) {
        TurnoResponseDTO turno = turnoService.crearTurno(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(turno);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarTurno(@PathVariable Long id) {
        turnoService.eliminarTurno(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TurnoResponseDTO> actualizarTurno(
            @PathVariable Long id,
            @Valid @RequestBody TurnoRequestDTO request) {
        TurnoResponseDTO turno = turnoService.actualizarTurno(id, request);
        return ResponseEntity.ok(turno);
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, String>> sincronizarConGoogleCalendar() {
        syncService.syncFromGoogleCalendar();
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Sincronización iniciada con Google Calendar"
        ));
    }
}
