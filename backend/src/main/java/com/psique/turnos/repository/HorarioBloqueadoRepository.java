package com.psique.turnos.repository;

import com.psique.turnos.model.HorarioBloqueado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HorarioBloqueadoRepository extends JpaRepository<HorarioBloqueado, Long> {
    
    List<HorarioBloqueado> findByProfesionalIdAndFecha(Long profesionalId, LocalDate fecha);
    
    @Query("SELECT h FROM HorarioBloqueado h WHERE h.profesional.id = :profesionalId " +
           "AND h.fecha BETWEEN :fechaInicio AND :fechaFin")
    List<HorarioBloqueado> findByProfesionalIdAndFechaBetween(
        Long profesionalId, LocalDate fechaInicio, LocalDate fechaFin);
}
