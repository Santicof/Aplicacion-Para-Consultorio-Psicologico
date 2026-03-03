package com.psique.turnos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "horarios_bloqueados")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HorarioBloqueado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private String horaInicio; // Formato "HH:mm"

    @Column(name = "hora_fin", nullable = false)
    private String horaFin; // Formato "HH:mm"

    @Column(nullable = false)
    private String motivo; // "VACACIONES", "OCUPADO", "OTRO"

    @Column(length = 500)
    private String descripcion;
}
