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

    @PostMapping
    public ResponseEntity<ProfesionalDTO> crear(@RequestBody ProfesionalDTO profesionalDTO) {
        var profesional = convertirDeDTOAEntidad(profesionalDTO);
        var profesionalGuardado = profesionalService.guardar(profesional);
        return ResponseEntity.ok(convertirADTO(profesionalGuardado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfesionalDTO> actualizar(
            @PathVariable Long id, 
            @RequestBody ProfesionalDTO profesionalDTO) {
        var profesional = convertirDeDTOAEntidad(profesionalDTO);
        return profesionalService.actualizar(id, profesional)
                .map(p -> ResponseEntity.ok(convertirADTO(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        try {
            profesionalService.eliminar(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private ProfesionalDTO convertirADTO(com.psique.turnos.model.Profesional profesional) {
        ProfesionalDTO dto = new ProfesionalDTO();
        dto.setId(profesional.getId());
        dto.setNombre(profesional.getNombre());
        dto.setTitulo(profesional.getTitulo());
        dto.setEspecialidad(profesional.getEspecialidad());
        dto.setDescripcion(profesional.getDescripcion());
        dto.setColorCalendario(profesional.getColorCalendario());
        dto.setHorarios(profesional.getHorarios());
        return dto;
    }

    private com.psique.turnos.model.Profesional convertirDeDTOAEntidad(ProfesionalDTO dto) {
        com.psique.turnos.model.Profesional profesional = new com.psique.turnos.model.Profesional();
        profesional.setId(dto.getId());
        profesional.setNombre(dto.getNombre());
        profesional.setTitulo(dto.getTitulo());
        profesional.setEspecialidad(dto.getEspecialidad());
        profesional.setDescripcion(dto.getDescripcion());
        profesional.setColorCalendario(dto.getColorCalendario());
        profesional.setHorarios(dto.getHorarios());
        return profesional;
    }
}
