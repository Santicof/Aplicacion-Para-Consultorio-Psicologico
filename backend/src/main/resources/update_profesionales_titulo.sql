-- Script para actualizar los profesionales existentes con sus títulos
-- Ejecutar después de que Hibernate cree la columna 'titulo'

-- Actualizar títulos basados en el nombre del profesional
UPDATE profesionales 
SET titulo = 'Lic.' 
WHERE nombre LIKE 'Lic.%' AND titulo IS NULL;

UPDATE profesionales 
SET titulo = 'Dr.' 
WHERE nombre LIKE 'Dr.%' AND titulo IS NULL;

UPDATE profesionales 
SET titulo = 'Dra.' 
WHERE nombre LIKE 'Dra.%' AND titulo IS NULL;

-- Opcional: remover el título del nombre si ya está incluido
-- (Descomenta estas líneas si quieres limpiar los nombres)
-- UPDATE profesionales 
-- SET nombre = TRIM(SUBSTRING(nombre FROM 5))
-- WHERE nombre LIKE 'Lic.%';

-- UPDATE profesionales 
-- SET nombre = TRIM(SUBSTRING(nombre FROM 4))
-- WHERE nombre LIKE 'Dr.%' OR nombre LIKE 'Dra.%';
