package com.psique.turnos.service;

import com.psique.turnos.dto.ProfesionalDTO;
import com.psique.turnos.model.Profesional;
import com.psique.turnos.repository.ProfesionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfesionalService {

    private final ProfesionalRepository profesionalRepository;

    public List<Profesional> obtenerTodos() {
        return profesionalRepository.findAll();
    }

    public List<ProfesionalDTO> obtenerTodosDTO() {
        return profesionalRepository.findAll().stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public Optional<Profesional> obtenerPorId(Long id) {
        return profesionalRepository.findById(id);
    }

    public Optional<ProfesionalDTO> obtenerPorIdDTO(Long id) {
        return profesionalRepository.findById(id)
                .map(this::convertirADTO);
    }

    @Transactional
    public Profesional guardar(Profesional profesional) {
        return profesionalRepository.save(profesional);
    }

    private ProfesionalDTO convertirADTO(Profesional profesional) {
        ProfesionalDTO dto = new ProfesionalDTO();
        dto.setId(profesional.getId());
        dto.setNombre(profesional.getNombre());
        dto.setEspecialidad(profesional.getEspecialidad());
        dto.setDescripcion(profesional.getDescripcion());
        dto.setHorarios(profesional.getHorarios());
        return dto;
    }
}
