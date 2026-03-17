package com.psique.turnos.controller;

import com.psique.turnos.model.Evento;
import com.psique.turnos.repository.EventoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {

    @Autowired
    private EventoRepository eventoRepository;

    // GET públicos - solo eventos activos (para el Home)
    @GetMapping("/publicos")
    public List<Evento> getEventosPublicos() {
        return eventoRepository.findByActivoTrueOrderByFechaEventoDesc();
    }

    // GET todos (para admin)
    @GetMapping
    public List<Evento> getAllEventos() {
        return eventoRepository.findAllByOrderByFechaCreacionDesc();
    }

    // POST crear evento con imagen en base64
    @PostMapping
    public ResponseEntity<?> crearEvento(@RequestBody Map<String, Object> body) {
        try {
            Evento evento = new Evento();
            evento.setTitulo((String) body.get("titulo"));
            evento.setDescripcion((String) body.get("descripcion"));
            
            if (body.get("fechaEvento") != null && !((String) body.get("fechaEvento")).isEmpty()) {
                evento.setFechaEvento(java.time.LocalDate.parse((String) body.get("fechaEvento")));
            }

            if (body.get("horarioEvento") != null) {
                evento.setHorarioEvento((String) body.get("horarioEvento"));
            }
            
            evento.setImagenBase64((String) body.get("imagenBase64"));
            evento.setActivo(true);

            Evento saved = eventoRepository.save(evento);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear evento: " + e.getMessage());
        }
    }

    // PUT actualizar evento
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarEvento(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return eventoRepository.findById(id).map(evento -> {
            if (body.containsKey("titulo")) evento.setTitulo((String) body.get("titulo"));
            if (body.containsKey("descripcion")) evento.setDescripcion((String) body.get("descripcion"));
            if (body.containsKey("fechaEvento")) {
                String fecha = (String) body.get("fechaEvento");
                evento.setFechaEvento(fecha != null && !fecha.isEmpty() ? java.time.LocalDate.parse(fecha) : null);
            }
            if (body.containsKey("horarioEvento")) evento.setHorarioEvento((String) body.get("horarioEvento"));
            if (body.containsKey("imagenBase64")) evento.setImagenBase64((String) body.get("imagenBase64"));
            if (body.containsKey("activo")) evento.setActivo((Boolean) body.get("activo"));

            return ResponseEntity.ok(eventoRepository.save(evento));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PUT toggle activo/inactivo
    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggleEvento(@PathVariable Long id) {
        return eventoRepository.findById(id).map(evento -> {
            evento.setActivo(!evento.isActivo());
            return ResponseEntity.ok(eventoRepository.save(evento));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE eliminar evento
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarEvento(@PathVariable Long id) {
        if (eventoRepository.existsById(id)) {
            eventoRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
