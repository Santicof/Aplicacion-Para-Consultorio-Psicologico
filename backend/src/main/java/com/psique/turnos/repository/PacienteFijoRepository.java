package com.psique.turnos.repository;

import com.psique.turnos.model.PacienteFijo;
import com.psique.turnos.model.Profesional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PacienteFijoRepository extends JpaRepository<PacienteFijo, Long> {
    List<PacienteFijo> findByProfesional(Profesional profesional);
    List<PacienteFijo> findByProfesionalId(Long profesionalId);
}
