package com.psique.turnos.service;

import com.psique.turnos.dto.HorarioBloqueadoDTO;
import com.psique.turnos.model.HorarioBloqueado;
import com.psique.turnos.model.Profesional;
import com.psique.turnos.repository.HorarioBloqueadoRepository;
import com.psique.turnos.repository.ProfesionalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HorarioBloqueadoService {

    private final HorarioBloqueadoRepository horarioBloqueadoRepository;
    private final ProfesionalRepository profesionalRepository;

    @Transactional
    public HorarioBloqueadoDTO crear(HorarioBloqueadoDTO dto) {
        Profesional profesional = profesionalRepository.findById(dto.getProfesionalId())
            .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));

        HorarioBloqueado bloqueo = new HorarioBloqueado();
        bloqueo.setProfesional(profesional);
        bloqueo.setFecha(LocalDate.parse(dto.getFecha()));
        bloqueo.setHoraInicio(dto.getHoraInicio());
        bloqueo.setHoraFin(dto.getHoraFin());
        bloqueo.setMotivo(dto.getMotivo());
        bloqueo.setDescripcion(dto.getDescripcion());

        HorarioBloqueado guardado = horarioBloqueadoRepository.save(bloqueo);
        log.info("🚫 Horario bloqueado creado: {} - {} a {} ({})", 
            guardado.getFecha(), guardado.getHoraInicio(), guardado.getHoraFin(), guardado.getMotivo());

        return convertirADTO(guardado);
    }

    @Transactional
    public HorarioBloqueadoDTO bloquearDiaCompleto(Long profesionalId, String fecha, String motivo, String descripcion) {
        HorarioBloqueadoDTO dto = new HorarioBloqueadoDTO();
        dto.setProfesionalId(profesionalId);
        dto.setFecha(fecha);
        dto.setHoraInicio("08:00");
        dto.setHoraFin("19:00");
        dto.setMotivo(motivo);
        dto.setDescripcion(descripcion);
        
        return crear(dto);
    }

    public List<HorarioBloqueadoDTO> obtenerPorProfesionalYFecha(Long profesionalId, String fecha) {
        LocalDate localDate = LocalDate.parse(fecha);
        return horarioBloqueadoRepository.findByProfesionalIdAndFecha(profesionalId, localDate)
            .stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }

    public List<HorarioBloqueadoDTO> obtenerPorProfesionalYRango(Long profesionalId, String fechaInicio, String fechaFin) {
        LocalDate inicio = LocalDate.parse(fechaInicio);
        LocalDate fin = LocalDate.parse(fechaFin);
        
        return horarioBloqueadoRepository.findByProfesionalIdAndFechaBetween(profesionalId, inicio, fin)
            .stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }

    public List<String> obtenerHorasBloqueadasParaFecha(Long profesionalId, String fecha) {
        List<HorarioBloqueado> bloqueos = horarioBloqueadoRepository
            .findByProfesionalIdAndFecha(profesionalId, LocalDate.parse(fecha));
        
        List<String> horasBloqueadas = new ArrayList<>();
        
        for (HorarioBloqueado bloqueo : bloqueos) {
            LocalTime inicio = LocalTime.parse(bloqueo.getHoraInicio());
            LocalTime fin = LocalTime.parse(bloqueo.getHoraFin());
            
            // Generar todas las horas entre inicio y fin
            LocalTime actual = inicio;
            while (!actual.isAfter(fin)) {
                horasBloqueadas.add(String.format("%02d:00", actual.getHour()));
                actual = actual.plusHours(1);
            }
        }
        
        return horasBloqueadas.stream().distinct().collect(Collectors.toList());
    }

    @Transactional
    public void eliminar(Long id) {
        HorarioBloqueado bloqueo = horarioBloqueadoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Bloqueo no encontrado"));
        
        log.info("🔓 Eliminando bloqueo: {} - {} a {}", 
            bloqueo.getFecha(), bloqueo.getHoraInicio(), bloqueo.getHoraFin());
        
        horarioBloqueadoRepository.deleteById(id);
    }

    private HorarioBloqueadoDTO convertirADTO(HorarioBloqueado bloqueo) {
        HorarioBloqueadoDTO dto = new HorarioBloqueadoDTO();
        dto.setId(bloqueo.getId());
        dto.setProfesionalId(bloqueo.getProfesional().getId());
        dto.setFecha(bloqueo.getFecha().toString());
        dto.setHoraInicio(bloqueo.getHoraInicio());
        dto.setHoraFin(bloqueo.getHoraFin());
        dto.setMotivo(bloqueo.getMotivo());
        dto.setDescripcion(bloqueo.getDescripcion());
        return dto;
    }
}
