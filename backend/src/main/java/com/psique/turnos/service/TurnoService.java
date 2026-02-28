package com.psique.turnos.service;

import com.psique.turnos.dto.TurnoRequestDTO;
import com.psique.turnos.dto.TurnoResponseDTO;
import com.psique.turnos.model.Profesional;
import com.psique.turnos.model.Turno;
import com.psique.turnos.repository.ProfesionalRepository;
import com.psique.turnos.repository.TurnoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TurnoService {

    private final TurnoRepository turnoRepository;
    private final ProfesionalRepository profesionalRepository;
    private final GoogleCalendarService googleCalendarService;

    public List<TurnoResponseDTO> obtenerTodos() {
        return turnoRepository.findAll().stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<TurnoResponseDTO> obtenerPorProfesionalYFecha(Long profesionalId, String fecha) {
        LocalDate localDate = LocalDate.parse(fecha);
        return turnoRepository.findByProfesionalIdAndFecha(profesionalId, localDate).stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TurnoResponseDTO crearTurno(TurnoRequestDTO request) {
        Profesional profesional = profesionalRepository.findById(request.getProfesionalId())
                .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));

        Turno turno = new Turno();
        turno.setProfesional(profesional);
        turno.setFecha(LocalDate.parse(request.getFecha()));
        turno.setHora(LocalTime.parse(request.getHora()));
        
        Turno.Paciente paciente = new Turno.Paciente();
        paciente.setNombre(request.getPaciente().getNombre());
        paciente.setTelefono(request.getPaciente().getTelefono());
        paciente.setEmail(request.getPaciente().getEmail());
        paciente.setMotivo(request.getPaciente().getMotivo());
        turno.setPaciente(paciente);
        
        turno.setEstado("confirmado");
        turno.setModalidad(request.getModalidad() != null ? request.getModalidad() : "presencial");

        // Guardar turno en BD
        Turno turnoGuardado = turnoRepository.save(turno);
        
        // Sincronizar con Google Calendar
        String googleEventId = googleCalendarService.createEvent(turnoGuardado);
        if (googleEventId != null) {
            turnoGuardado.setGoogleEventId(googleEventId);
            turnoGuardado = turnoRepository.save(turnoGuardado);
        }
        
        return convertirADTO(turnoGuardado);
    }

    @Transactional
    public void eliminarTurno(Long id) {
        // Obtener el turno antes de eliminarlo para obtener el googleEventId
        Turno turno = turnoRepository.findById(id).orElse(null);
        
        if (turno != null) {
            // Eliminar de Google Calendar si existe
            if (turno.getGoogleEventId() != null) {
                googleCalendarService.deleteEvent(turno.getGoogleEventId());
            }
            
            // Eliminar de la base de datos
            turnoRepository.deleteById(id);
        }
    }
    
    @Transactional
    public TurnoResponseDTO actualizarTurno(Long id, TurnoRequestDTO request) {
        Turno turno = turnoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Turno no encontrado"));
        
        // Actualizar datos del turno
        turno.setFecha(LocalDate.parse(request.getFecha()));
        turno.setHora(LocalTime.parse(request.getHora()));
        
        Turno.Paciente paciente = turno.getPaciente();
        paciente.setNombre(request.getPaciente().getNombre());
        paciente.setTelefono(request.getPaciente().getTelefono());
        paciente.setEmail(request.getPaciente().getEmail());
        paciente.setMotivo(request.getPaciente().getMotivo());
        
        // Guardar cambios
        Turno turnoActualizado = turnoRepository.save(turno);
        
        // Sincronizar con Google Calendar
        googleCalendarService.updateEvent(turnoActualizado);
        
        return convertirADTO(turnoActualizado);
    }

    private TurnoResponseDTO convertirADTO(Turno turno) {
        TurnoResponseDTO dto = new TurnoResponseDTO();
        dto.setId(turno.getId());
        dto.setProfesionalId(turno.getProfesional().getId());
        dto.setFecha(turno.getFecha().toString());
        dto.setHora(turno.getHora().toString());
        dto.setEstado(turno.getEstado());
        dto.setModalidad(turno.getModalidad());
        
        if (turno.getPaciente() != null) {
            com.psique.turnos.dto.PacienteDTO pacienteDTO = new com.psique.turnos.dto.PacienteDTO();
            pacienteDTO.setNombre(turno.getPaciente().getNombre());
            pacienteDTO.setTelefono(turno.getPaciente().getTelefono());
            pacienteDTO.setEmail(turno.getPaciente().getEmail());
            pacienteDTO.setMotivo(turno.getPaciente().getMotivo());
            dto.setPaciente(pacienteDTO);
        }
        
        return dto;
    }
}
