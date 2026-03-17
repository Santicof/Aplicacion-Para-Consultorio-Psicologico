package com.psique.turnos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "profesionales")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Profesional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column
    private String titulo;

    @Column(nullable = false)
    private String especialidad;

    @Column(length = 500)
    private String descripcion;

    @Column(length = 10)
    private String colorCalendario = "9"; // Color por defecto: Arándano (Azul)

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "profesional_horarios", joinColumns = @JoinColumn(name = "profesional_id"))
    @Column(name = "horario")
    private List<String> horarios;
}
