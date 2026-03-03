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

    @Transactional
    public void eliminar(Long id) {
        profesionalRepository.deleteById(id);
    }

    @Transactional
    public Optional<Profesional> actualizar(Long id, Profesional profesionalActualizado) {
        return profesionalRepository.findById(id)
                .map(profesional -> {
                    profesional.setNombre(profesionalActualizado.getNombre());
                    profesional.setTitulo(profesionalActualizado.getTitulo());
                    profesional.setEspecialidad(profesionalActualizado.getEspecialidad());
                    profesional.setDescripcion(profesionalActualizado.getDescripcion());
                    profesional.setColorCalendario(profesionalActualizado.getColorCalendario());
                    if (profesionalActualizado.getHorarios() != null) {
                        profesional.setHorarios(profesionalActualizado.getHorarios());
                    }
                    return profesionalRepository.save(profesional);
                });
    }

    private ProfesionalDTO convertirADTO(Profesional profesional) {
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
}
