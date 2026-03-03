-- Script para crear la tabla de pacientes fijos
-- Ejecutar en la base de datos PostgreSQL

CREATE TABLE IF NOT EXISTS pacientes_fijos (
    id BIGSERIAL PRIMARY KEY,
    profesional_id BIGINT NOT NULL,
    nombre_paciente VARCHAR(255) NOT NULL,
    dia_semana VARCHAR(20) NOT NULL CHECK (dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
    hora VARCHAR(5) NOT NULL,
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('presencial', 'virtual')),
    observaciones TEXT,
    google_event_id VARCHAR(255),
    CONSTRAINT fk_profesional_paciente_fijo FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_pacientes_fijos_profesional ON pacientes_fijos(profesional_id);
CREATE INDEX idx_pacientes_fijos_dia_semana ON pacientes_fijos(dia_semana);
CREATE INDEX idx_pacientes_fijos_google_event ON pacientes_fijos(google_event_id);

-- Comentarios sobre la tabla
COMMENT ON TABLE pacientes_fijos IS 'Pacientes con turnos recurrentes semanales que se sincronizan con Google Calendar';
COMMENT ON COLUMN pacientes_fijos.dia_semana IS 'Día de la semana del turno recurrente';
COMMENT ON COLUMN pacientes_fijos.hora IS 'Hora del turno en formato HH:mm';
COMMENT ON COLUMN pacientes_fijos.google_event_id IS 'ID del evento recurrente en Google Calendar';
