--        
-- CLÍNICA DENTAL - TABLAS + DATOS DE EJEMPLO
--

--     
-- TABLA: PACIENTES
--     
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  telefono VARCHAR(20),
  email VARCHAR(100),
  direccion TEXT,
  ultima_visita DATE
);

INSERT INTO pacientes (nombres, apellidos, fecha_nacimiento, telefono, email, direccion) VALUES
('María José', 'Hernández López', '1990-03-15', '7890-1234', 'maria.hernandez@gmail.com', 'Col. Escalón, San Salvador'),
('Carlos Alberto', 'Martínez Rivas', '1985-07-22', '7654-3210', 'carlos.martinez@hotmail.com', 'Res. San Luis, Santa Tecla'),
('Ana Gabriela', 'Pérez Sandoval', '1978-11-08', '6543-2109', 'ana.perez@yahoo.com', 'Col. Médica, San Salvador'),
('José Roberto', 'García Mendoza', '2000-01-30', '7123-4567', 'jose.garcia@gmail.com', 'Antiguo Cuscatlán'),
('Sofía Elizabeth', 'Ramos Figueroa', '1995-09-12', '6234-5678', 'sofia.ramos@outlook.com', 'Col. San Benito, San Salvador');


--     
-- TABLA: PERSONAL
--     
CREATE TABLE personal (
  id SERIAL PRIMARY KEY,
  nombre_completo VARCHAR(150) NOT NULL,
  cargo VARCHAR(50) CHECK (cargo IN ('Odontologo', 'Asistente', 'Recepcion')),
  especialidad VARCHAR(100),
  no_licencia VARCHAR(50)
);

INSERT INTO personal (nombre_completo, cargo, especialidad, no_licencia) VALUES
('Dr. Ricardo Alejandro Vásquez', 'Odontologo', 'Odontología General', 'JVPM-12345'),
('Dra. Carmen Elena Portillo', 'Odontologo', 'Ortodoncia', 'JVPM-23456'),
('Dr. Fernando José Aguirre', 'Odontologo', 'Endodoncia', 'JVPM-34567'),
('Karla Patricia Montes', 'Asistente', NULL, NULL),
('Mónica del Carmen Reyes', 'Recepcion', NULL, NULL);


--     
-- TABLA: CATALOGO_TRATAMIENTOS
--     
CREATE TABLE catalogo_tratamientos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  costo_base DECIMAL(10, 2)
);

INSERT INTO catalogo_tratamientos (nombre, descripcion, costo_base) VALUES
('Limpieza Dental', 'Profilaxis dental completa con ultrasonido y pulido', 35.00),
('Extracción Simple', 'Extracción de pieza dental sin complicaciones', 25.00),
('Obturación Resina', 'Restauración con resina fotocurada', 45.00),
('Endodoncia Unirradicular', 'Tratamiento de conducto en diente de una raíz', 150.00),
('Corona de Porcelana', 'Corona dental de porcelana sobre metal', 250.00);


--     
-- TABLA: CITAS
--     
CREATE TABLE citas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id INTEGER REFERENCES personal(id) ON DELETE SET NULL,
  fecha_hora TIMESTAMP NOT NULL,
  motivo VARCHAR(255),
  estado VARCHAR(20) DEFAULT 'Programada' CHECK (estado IN ('Programada', 'Completada', 'Cancelada'))
);

INSERT INTO citas (paciente_id, doctor_id, fecha_hora, motivo, estado) VALUES
(1, 1, '2025-01-10 09:00:00', 'Limpieza dental de rutina', 'Completada'),
(2, 2, '2025-01-10 10:30:00', 'Consulta de ortodoncia', 'Completada'),
(3, 3, '2025-01-11 14:00:00', 'Dolor en muela inferior', 'Completada'),
(4, 1, '2025-01-15 11:00:00', 'Primera consulta', 'Programada'),
(5, 2, '2025-01-15 15:30:00', 'Revisión de brackets', 'Programada');


--     
-- TABLA: TRATAMIENTOS_REALIZADOS
--     
CREATE TABLE tratamientos_realizados (
  id SERIAL PRIMARY KEY,
  cita_id INTEGER REFERENCES citas(id) ON DELETE CASCADE,
  tratamiento_id INTEGER REFERENCES catalogo_tratamientos(id) ON DELETE SET NULL,
  diente_afectado INTEGER,
  costo_final DECIMAL(10, 2),
  notas TEXT
);

INSERT INTO tratamientos_realizados (cita_id, tratamiento_id, diente_afectado, costo_final, notas) VALUES
(1, 1, NULL, 35.00, 'Limpieza completa, paciente con buena higiene'),
(2, 1, NULL, 35.00, 'Limpieza previa a evaluación ortodóntica'),
(3, 4, 36, 150.00, 'Endodoncia en primer molar inferior izquierdo'),
(3, 3, 37, 50.00, 'Obturación preventiva en segundo molar'),
(1, 3, 14, 45.00, 'Pequeña caries detectada y tratada');


--     
-- TABLA: ODONTOGRAMA
--     
CREATE TABLE odontograma (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  diente_numero INTEGER NOT NULL CHECK (diente_numero BETWEEN 11 AND 48),
  estado VARCHAR(30) CHECK (estado IN ('Sano', 'Caries', 'Ausente', 'Corona', 'Obturado', 'Endodoncia')),
  fecha_actualizacion DATE DEFAULT CURRENT_DATE,
  CONSTRAINT uq_odontograma_paciente_diente UNIQUE (paciente_id, diente_numero)
);

INSERT INTO odontograma (paciente_id, diente_numero, estado, fecha_actualizacion) VALUES
(1, 14, 'Obturado', '2025-01-10'),
(1, 36, 'Corona', '2024-06-15'),
(3, 36, 'Endodoncia', '2025-01-11'),
(3, 37, 'Obturado', '2025-01-11'),
(2, 18, 'Ausente', '2024-03-20');


--     
-- TABLA: FACTURAS
--     
CREATE TABLE facturas (
  id SERIAL PRIMARY KEY,
  cita_id INTEGER UNIQUE REFERENCES citas(id) ON DELETE SET NULL,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha_emision TIMESTAMP DEFAULT NOW(),
  monto_total DECIMAL(10, 2),
  estado_pago VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_pago IN ('Pendiente', 'Pagado', 'Parcial', 'Anulado'))
);

INSERT INTO facturas (cita_id, paciente_id, fecha_emision, monto_total, estado_pago) VALUES
(1, 1, '2025-01-10 09:45:00', 80.00, 'Pagado'),
(2, 2, '2025-01-10 11:15:00', 35.00, 'Pagado'),
(3, 3, '2025-01-11 15:30:00', 200.00, 'Parcial'),
(NULL, 4, '2024-12-20 10:00:00', 150.00, 'Pendiente'),
(NULL, 5, '2024-11-15 14:00:00', 250.00, 'Pagado');


--     
-- TABLA: DETALLE_FACTURA
--     
CREATE TABLE detalle_factura (
  id SERIAL PRIMARY KEY,
  factura_id INTEGER REFERENCES facturas(id) ON DELETE CASCADE,
  descripcion VARCHAR(255),
  monto DECIMAL(10, 2)
);

INSERT INTO detalle_factura (factura_id, descripcion, monto) VALUES
(1, 'Limpieza Dental', 35.00),
(1, 'Obturación Resina - Pieza 14', 45.00),
(2, 'Limpieza Dental', 35.00),
(3, 'Endodoncia Unirradicular - Pieza 36', 150.00),
(3, 'Obturación Resina - Pieza 37', 50.00);


-- 
-- ÍNDICES
-- 
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_doctor ON citas(doctor_id);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_odontograma_paciente ON odontograma(paciente_id);
CREATE INDEX idx_facturas_paciente ON facturas(paciente_id);
CREATE INDEX idx_facturas_estado ON facturas(estado_pago);