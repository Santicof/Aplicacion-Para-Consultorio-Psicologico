package com.psique.turnos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurnoResponseDTO {
    private Long id;
    private Long profesionalId;
    private String fecha;
    private String hora;
    private PacienteDTO paciente;
    private String estado;
}
