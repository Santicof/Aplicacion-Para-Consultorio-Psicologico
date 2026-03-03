package com.psique.turnos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteFijoDTO {
    private Long id;
    private Long profesionalId;
    private String nombreProfesional;
    private String nombrePaciente;
    private List<String> diasSemana;
    private String hora;
    private String modalidad;
    private String observaciones;
    private String googleEventId;
}
