package com.psique.turnos.repository;

import com.psique.turnos.model.DiaNoLaborable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiaNoLaborableRepository extends JpaRepository<DiaNoLaborable, Long> {
    List<DiaNoLaborable> findByFecha(String fecha);
}
