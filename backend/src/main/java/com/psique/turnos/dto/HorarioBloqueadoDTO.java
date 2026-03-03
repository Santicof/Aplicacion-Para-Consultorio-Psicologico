package com.psique.turnos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HorarioBloqueadoDTO {
    private Long id;
    private Long profesionalId;
    private String fecha; // "YYYY-MM-DD"
    private String horaInicio; // "HH:mm"
    private String horaFin; // "HH:mm"
    private String motivo; // "VACACIONES", "OCUPADO", "OTRO"
    private String descripcion;
}
