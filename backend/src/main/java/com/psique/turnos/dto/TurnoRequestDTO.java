package com.psique.turnos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurnoRequestDTO {
    
    @NotNull(message = "El ID del profesional es obligatorio")
    private Long profesionalId;
    
    @NotBlank(message = "La fecha es obligatoria")
    private String fecha;
    
    @NotBlank(message = "La hora es obligatoria")
    private String hora;
    
    @NotNull(message = "Los datos del paciente son obligatorios")
    private PacienteDTO paciente;
}
