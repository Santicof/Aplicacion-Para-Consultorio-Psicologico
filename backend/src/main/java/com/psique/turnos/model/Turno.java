package com.psique.turnos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "turnos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Turno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "profesional_id", nullable = false)
    private Profesional profesional;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    @Embedded
    private Paciente paciente;

    @Column(nullable = false)
    private String estado = "confirmado";

    @Embeddable
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Paciente {
        
        @Column(nullable = false)
        private String nombre;
        
        @Column(nullable = false)
        private String telefono;
        
        private String email;
        
        @Column(length = 500)
        private String motivo;
    }
}
