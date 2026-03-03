package com.psique.turnos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "pacientes_fijos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteFijo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @Column(nullable = false)
    private String nombrePaciente;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "paciente_fijo_dias", joinColumns = @JoinColumn(name = "paciente_fijo_id"))
    @Column(name = "dia_semana")
    @Enumerated(EnumType.STRING)
    private List<DiaSemana> diasSemana;

    @Column(nullable = false)
    private String hora; // Formato "HH:mm"

    @Column(nullable = false)
    private String modalidad; // "presencial" o "virtual"

    @Column(length = 500)
    private String observaciones;

    @Column(name = "google_event_id")
    private String googleEventId; // ID del evento recurrente en Google Calendar

    public enum DiaSemana {
        LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO
    }
}
