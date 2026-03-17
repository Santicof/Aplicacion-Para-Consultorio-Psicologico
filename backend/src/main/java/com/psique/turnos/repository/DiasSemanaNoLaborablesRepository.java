package com.psique.turnos.repository;

import com.psique.turnos.model.DiasSemanaNoLaborables;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiasSemanaNoLaborablesRepository extends JpaRepository<DiasSemanaNoLaborables, Long> {
}
