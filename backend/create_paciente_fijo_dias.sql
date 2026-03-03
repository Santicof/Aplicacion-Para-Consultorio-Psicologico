-- Crear tabla para los días de pacientes fijos (relación muchos a muchos con  días de la semana)

-- Primero verificar si la tabla pacientes_fijos existe, si no crearla
CREATE TABLE IF NOT EXISTS pacientes_fijos (
    id BIGSERIAL PRIMARY KEY,
    profesional_id BIGINT NOT NULL REFERENCES profesionales(id),
    nombre_paciente VARCHAR(255) NOT NULL,
    hora VARCHAR(10) NOT NULL,
    modalidad VARCHAR(50) NOT NULL,
    observaciones TEXT,
    google_event_id VARCHAR(255),
    CONSTRAINT fk_profesional FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

-- Crear la tabla de relación para múltiples días
CREATE TABLE IF NOT EXISTS paciente_fijo_dias (
    paciente_fijo_id BIGINT NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    CONSTRAINT fk_paciente_fijo FOREIGN KEY (paciente_fijo_id) REFERENCES pacientes_fijos(id) ON DELETE CASCADE,
    PRIMARY KEY (paciente_fijo_id, dia_semana)
);

-- Verificar las tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('pacientes_fijos', 'paciente_fijo_dias') 
AND table_schema = 'public';
