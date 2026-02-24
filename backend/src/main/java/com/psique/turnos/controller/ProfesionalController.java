package com.psique.turnos.controller;

import com.psique.turnos.dto.ProfesionalDTO;
import com.psique.turnos.service.ProfesionalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profesionales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfesionalController {

    private final ProfesionalService profesionalService;

    @GetMapping
    public ResponseEntity<List<ProfesionalDTO>> obtenerTodos() {
        return ResponseEntity.ok(profesionalService.obtenerTodosDTO());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfesionalDTO> obtenerPorId(@PathVariable Long id) {
        return profesionalService.obtenerPorIdDTO(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
