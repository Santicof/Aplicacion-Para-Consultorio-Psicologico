package com.psique.turnos.service;

import com.psique.turnos.model.DiaNoLaborable;
import com.psique.turnos.repository.DiaNoLaborableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiaNoLaborableService {
    private final DiaNoLaborableRepository repository;

    public List<DiaNoLaborable> obtenerTodos() {
        return repository.findAll();
    }

    public List<DiaNoLaborable> obtenerPorFecha(String fecha) {
        return repository.findByFecha(fecha);
    }

    @Transactional
    public DiaNoLaborable crear(DiaNoLaborable dia) {
        return repository.save(dia);
    }

    @Transactional
    public void eliminar(Long id) {
        repository.deleteById(id);
    }
}
