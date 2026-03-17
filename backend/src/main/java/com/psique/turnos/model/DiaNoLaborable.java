package com.psique.turnos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dias_no_laborables")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiaNoLaborable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fecha; // formato YYYY-MM-DD

    @Column(length = 255)
    private String motivo;
}
