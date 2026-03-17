package com.psique.turnos.service;

import com.psique.turnos.model.DiasSemanaNoLaborables;
import com.psique.turnos.repository.DiasSemanaNoLaborablesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiasSemanaNoLaborablesService {
    private final DiasSemanaNoLaborablesRepository repository;

    public List<DiasSemanaNoLaborables> obtenerTodos() {
        return repository.findAll();
    }

    @Transactional
    public void eliminarTodos() {
        repository.deleteAll();
    }

    @Transactional
    public DiasSemanaNoLaborables actualizarDiasSemana(List<String> diasSemana) {
        DiasSemanaNoLaborables entity;
        List<DiasSemanaNoLaborables> existentes = repository.findAll();
        if (existentes.isEmpty()) {
            entity = new DiasSemanaNoLaborables();
        } else {
            entity = existentes.get(0);
        }
        entity.setDiasSemana(diasSemana);
        return repository.save(entity);
    }
}
