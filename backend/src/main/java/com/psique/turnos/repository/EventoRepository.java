package com.psique.turnos.repository;

import com.psique.turnos.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {
    List<Evento> findByActivoTrueOrderByFechaEventoDesc();
    List<Evento> findAllByOrderByFechaCreacionDesc();
}
