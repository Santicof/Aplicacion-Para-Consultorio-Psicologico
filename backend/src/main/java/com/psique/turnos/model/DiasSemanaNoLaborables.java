package com.psique.turnos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "dias_semana_no_laborables")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiasSemanaNoLaborables {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "dias_semana_no_laborables_lista", joinColumns = @JoinColumn(name = "dias_semana_id"))
    @Column(name = "dia_semana")
    private List<String> diasSemana;
}
