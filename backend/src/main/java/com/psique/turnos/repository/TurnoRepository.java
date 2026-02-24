package com.psique.turnos.repository;

import com.psique.turnos.model.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {
    
    List<Turno> findByProfesionalIdAndFecha(Long profesionalId, LocalDate fecha);
    
    List<Turno> findByProfesionalId(Long profesionalId);
    
    List<Turno> findByFecha(LocalDate fecha);
}
