package com.psique.turnos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfesionalDTO {
    private Long id;
    private String nombre;
    private String especialidad;
    private String descripcion;
    private List<String> horarios;
}
