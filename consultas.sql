
-- CLÍNICA DENTAL - TRIGGERS, VIEWS Y FUNCIONES

-- TRIGGERS (5)


-- 1. Actualizar monto_total de factura al insertar/modificar detalles
CREATE OR REPLACE FUNCTION fn_actualizar_monto_factura()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE facturas
  SET monto_total = (
    SELECT COALESCE(SUM(monto), 0)
    FROM detalle_factura
    WHERE factura_id = COALESCE(NEW.factura_id, OLD.factura_id)
  )
  WHERE id = COALESCE(NEW.factura_id, OLD.factura_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_monto_factura
AFTER INSERT OR UPDATE OR DELETE ON detalle_factura
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_monto_factura();


-- 2. Crear factura automáticamente cuando cita se completa
CREATE OR REPLACE FUNCTION fn_crear_factura_al_completar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'Completada' AND OLD.estado != 'Completada' THEN
    INSERT INTO facturas (cita_id, paciente_id, monto_total, estado_pago)
    VALUES (NEW.id, NEW.paciente_id, 0, 'Pendiente')
    ON CONFLICT (cita_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crear_factura_al_completar
AFTER UPDATE ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_crear_factura_al_completar();


-- 3. Actualizar odontograma al registrar tratamiento en diente específico
CREATE OR REPLACE FUNCTION fn_actualizar_odontograma()
RETURNS TRIGGER AS $$
DECLARE
  v_paciente_id INTEGER;
  v_nuevo_estado VARCHAR(30);
BEGIN
  IF NEW.diente_afectado IS NOT NULL THEN
    SELECT c.paciente_id INTO v_paciente_id
    FROM citas c
    WHERE c.id = NEW.cita_id;
    
    SELECT 
      CASE 
        WHEN ct.nombre ILIKE '%corona%' THEN 'Corona'
        WHEN ct.nombre ILIKE '%endodoncia%' THEN 'Endodoncia'
        WHEN ct.nombre ILIKE '%extraccion%' THEN 'Ausente'
        WHEN ct.nombre ILIKE '%obturacion%' OR ct.nombre ILIKE '%resina%' THEN 'Obturado'
        ELSE 'Sano'
      END INTO v_nuevo_estado
    FROM catalogo_tratamientos ct
    WHERE ct.id = NEW.tratamiento_id;
    
    INSERT INTO odontograma (paciente_id, diente_numero, estado, fecha_actualizacion)
    VALUES (v_paciente_id, NEW.diente_afectado, v_nuevo_estado, CURRENT_DATE)
    ON CONFLICT (paciente_id, diente_numero) 
    DO UPDATE SET estado = v_nuevo_estado, fecha_actualizacion = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_odontograma
AFTER INSERT ON tratamientos_realizados
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_odontograma();


-- 4. Validar que solo odontólogos puedan tener citas asignadas
CREATE OR REPLACE FUNCTION fn_validar_doctor_cita()
RETURNS TRIGGER AS $$
DECLARE
  v_cargo VARCHAR(50);
BEGIN
  SELECT cargo INTO v_cargo
  FROM personal
  WHERE id = NEW.doctor_id;
  
  IF v_cargo != 'Odontologo' THEN
    RAISE EXCEPTION 'Solo el personal con cargo Odontologo puede atender citas';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_doctor_cita
BEFORE INSERT OR UPDATE ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_validar_doctor_cita();


-- 5. Registrar última actividad del paciente (agregar columna primero)
-- 1) Add column idempotently
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS ultima_visita DATE;

-- 2) Create or replace the trigger function (use security-definer only if needed)
CREATE OR REPLACE FUNCTION fn_actualizar_ultima_visita()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update when estado became 'Completada'
  -- Use TG_OP or compare OLD vs NEW to avoid unnecessary updates
  IF NEW.estado = 'Completada' AND (OLD IS NULL OR OLD.estado IS DISTINCT FROM NEW.estado) THEN
    UPDATE pacientes
    SET ultima_visita = CURRENT_DATE
    WHERE id = NEW.paciente_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Create trigger if it doesn't exist (Postgres has no CREATE TRIGGER IF NOT EXISTS)
-- So drop if exists, then create (safe in development). In production be cautious.
DROP TRIGGER IF EXISTS trg_actualizar_ultima_visita ON citas;

CREATE TRIGGER trg_actualizar_ultima_visita
AFTER UPDATE ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_ultima_visita();

-- ===================
-- VIEWS (5)
-- ===================

-- 1. Citas del día con información completa
CREATE OR REPLACE VIEW vw_citas_hoy AS
SELECT 
  c.id AS cita_id,
  c.fecha_hora,
  c.motivo,
  c.estado,
  p.id AS paciente_id,
  p.nombres || ' ' || p.apellidos AS paciente_nombre,
  p.telefono AS paciente_telefono,
  per.id AS doctor_id,
  per.nombre_completo AS doctor_nombre,
  per.especialidad AS doctor_especialidad
FROM citas c
JOIN pacientes p ON c.paciente_id = p.id
JOIN personal per ON c.doctor_id = per.id
WHERE DATE(c.fecha_hora) = CURRENT_DATE
ORDER BY c.fecha_hora;


-- 2. Historial completo de tratamientos por paciente
CREATE OR REPLACE VIEW vw_historial_tratamientos AS
SELECT 
  p.id AS paciente_id,
  p.nombres || ' ' || p.apellidos AS paciente_nombre,
  c.fecha_hora AS fecha_cita,
  ct.nombre AS tratamiento,
  tr.diente_afectado,
  tr.costo_final,
  tr.notas,
  per.nombre_completo AS atendido_por
FROM tratamientos_realizados tr
JOIN citas c ON tr.cita_id = c.id
JOIN pacientes p ON c.paciente_id = p.id
JOIN catalogo_tratamientos ct ON tr.tratamiento_id = ct.id
JOIN personal per ON c.doctor_id = per.id
ORDER BY p.id, c.fecha_hora DESC;


-- 3. Facturas pendientes de pago
CREATE OR REPLACE VIEW vw_facturas_pendientes AS
SELECT 
  f.id AS factura_id,
  f.fecha_emision,
  f.monto_total,
  f.estado_pago,
  p.id AS paciente_id,
  p.nombres || ' ' || p.apellidos AS paciente_nombre,
  p.telefono,
  p.email,
  CURRENT_DATE - DATE(f.fecha_emision) AS dias_pendiente
FROM facturas f
JOIN pacientes p ON f.paciente_id = p.id
WHERE f.estado_pago IN ('Pendiente', 'Parcial')
ORDER BY dias_pendiente DESC;


-- 4. Resumen de ingresos por mes
CREATE OR REPLACE VIEW vw_ingresos_mensuales AS
SELECT 
  TO_CHAR(f.fecha_emision, 'YYYY-MM') AS mes,
  COUNT(DISTINCT f.id) AS total_facturas,
  COUNT(DISTINCT f.paciente_id) AS pacientes_atendidos,
  SUM(CASE WHEN f.estado_pago = 'Pagado' THEN f.monto_total ELSE 0 END) AS ingresos_cobrados,
  SUM(CASE WHEN f.estado_pago IN ('Pendiente', 'Parcial') THEN f.monto_total ELSE 0 END) AS ingresos_pendientes,
  SUM(f.monto_total) AS ingresos_totales
FROM facturas f
WHERE f.estado_pago != 'Anulado'
GROUP BY TO_CHAR(f.fecha_emision, 'YYYY-MM')
ORDER BY mes DESC;


-- 5. Odontograma completo por paciente (vista para renderizar)
CREATE OR REPLACE VIEW vw_odontograma_completo AS
SELECT 
  p.id AS paciente_id,
  p.nombres || ' ' || p.apellidos AS paciente_nombre,
  o.diente_numero,
  CASE 
    WHEN o.diente_numero BETWEEN 11 AND 18 THEN 'Superior Derecho'
    WHEN o.diente_numero BETWEEN 21 AND 28 THEN 'Superior Izquierdo'
    WHEN o.diente_numero BETWEEN 31 AND 38 THEN 'Inferior Izquierdo'
    WHEN o.diente_numero BETWEEN 41 AND 48 THEN 'Inferior Derecho'
  END AS cuadrante,
  COALESCE(o.estado, 'Sano') AS estado,
  o.fecha_actualizacion
FROM pacientes p
CROSS JOIN generate_series(1, 32) AS diente_idx
LEFT JOIN odontograma o ON p.id = o.paciente_id 
  AND o.diente_numero = CASE 
    WHEN diente_idx <= 8 THEN 10 + diente_idx
    WHEN diente_idx <= 16 THEN 20 + (diente_idx - 8)
    WHEN diente_idx <= 24 THEN 30 + (diente_idx - 16)
    ELSE 40 + (diente_idx - 24)
  END
ORDER BY p.id, diente_numero;


-- FUNCIONES / STORED PROCEDURES (5)

-- 1. Obtener agenda de un doctor por rango de fechas
CREATE OR REPLACE FUNCTION fn_agenda_doctor(
  p_doctor_id INTEGER,
  p_fecha_inicio DATE DEFAULT CURRENT_DATE,
  p_fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  cita_id INTEGER,
  fecha_hora TIMESTAMP,
  paciente_nombre VARCHAR,
  paciente_telefono VARCHAR,
  motivo VARCHAR,
  estado VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.fecha_hora,
    (p.nombres || ' ' || p.apellidos)::VARCHAR,
    p.telefono,
    c.motivo,
    c.estado
  FROM citas c
  JOIN pacientes p ON c.paciente_id = p.id
  WHERE c.doctor_id = p_doctor_id
    AND DATE(c.fecha_hora) BETWEEN p_fecha_inicio AND p_fecha_fin
  ORDER BY c.fecha_hora;
END;
$$ LANGUAGE plpgsql;


-- 2. Buscar pacientes (búsqueda flexible)
CREATE OR REPLACE FUNCTION fn_buscar_pacientes(
  p_termino VARCHAR
)
RETURNS TABLE (
  id INTEGER,
  nombre_completo VARCHAR,
  telefono VARCHAR,
  email VARCHAR,
  ultima_visita DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    (p.nombres || ' ' || p.apellidos)::VARCHAR,
    p.telefono,
    p.email,
    p.ultima_visita
  FROM pacientes p
  WHERE 
    p.nombres ILIKE '%' || p_termino || '%'
    OR p.apellidos ILIKE '%' || p_termino || '%'
    OR p.telefono ILIKE '%' || p_termino || '%'
    OR p.email ILIKE '%' || p_termino || '%'
  ORDER BY p.apellidos, p.nombres
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;


-- 3. Generar reporte de producción por doctor
CREATE OR REPLACE FUNCTION fn_reporte_produccion_doctor(
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS TABLE (
  doctor_id INTEGER,
  doctor_nombre VARCHAR,
  especialidad VARCHAR,
  citas_completadas BIGINT,
  citas_canceladas BIGINT,
  total_facturado NUMERIC,
  total_cobrado NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    per.id,
    per.nombre_completo::VARCHAR,
    per.especialidad::VARCHAR,
    COUNT(CASE WHEN c.estado = 'Completada' THEN 1 END),
    COUNT(CASE WHEN c.estado = 'Cancelada' THEN 1 END),
    COALESCE(SUM(f.monto_total), 0),
    COALESCE(SUM(CASE WHEN f.estado_pago = 'Pagado' THEN f.monto_total ELSE 0 END), 0)
  FROM personal per
  LEFT JOIN citas c ON per.id = c.doctor_id 
    AND DATE(c.fecha_hora) BETWEEN p_fecha_inicio AND p_fecha_fin
  LEFT JOIN facturas f ON c.id = f.cita_id
  WHERE per.cargo = 'Odontologo'
  GROUP BY per.id, per.nombre_completo, per.especialidad
  ORDER BY total_facturado DESC;
END;
$$ LANGUAGE plpgsql;


-- 4. Agendar cita con validaciones
CREATE OR REPLACE FUNCTION fn_agendar_cita(
  p_paciente_id INTEGER,
  p_doctor_id INTEGER,
  p_fecha_hora TIMESTAMP,
  p_motivo VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_cita_existente INTEGER;
  v_nueva_cita_id INTEGER;
BEGIN
  -- Verificar si el doctor ya tiene cita en ese horario (margen de 30 min)
  SELECT id INTO v_cita_existente
  FROM citas
  WHERE doctor_id = p_doctor_id
    AND estado != 'Cancelada'
    AND fecha_hora BETWEEN p_fecha_hora - INTERVAL '29 minutes' 
                       AND p_fecha_hora + INTERVAL '29 minutes';
  
  IF v_cita_existente IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El doctor ya tiene una cita programada en ese horario'
    );
  END IF;
  
  -- Verificar si el paciente ya tiene cita ese día
  SELECT id INTO v_cita_existente
  FROM citas
  WHERE paciente_id = p_paciente_id
    AND estado != 'Cancelada'
    AND DATE(fecha_hora) = DATE(p_fecha_hora);
  
  IF v_cita_existente IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El paciente ya tiene una cita programada para ese día'
    );
  END IF;
  
  -- Crear la cita
  INSERT INTO citas (paciente_id, doctor_id, fecha_hora, motivo, estado)
  VALUES (p_paciente_id, p_doctor_id, p_fecha_hora, p_motivo, 'Programada')
  RETURNING id INTO v_nueva_cita_id;
  
  RETURN json_build_object(
    'success', true,
    'cita_id', v_nueva_cita_id,
    'message', 'Cita agendada correctamente'
  );
END;
$$ LANGUAGE plpgsql;


-- 5. Obtener resumen de cuenta de paciente
CREATE OR REPLACE FUNCTION fn_estado_cuenta_paciente(
  p_paciente_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_resultado JSON;
BEGIN
  SELECT json_build_object(
    'paciente', (
      SELECT json_build_object(
        'id', p.id,
        'nombre', p.nombres || ' ' || p.apellidos,
        'telefono', p.telefono,
        'email', p.email
      )
      FROM pacientes p WHERE p.id = p_paciente_id
    ),
    'resumen', (
      SELECT json_build_object(
        'total_facturado', COALESCE(SUM(monto_total), 0),
        'total_pagado', COALESCE(SUM(CASE WHEN estado_pago = 'Pagado' THEN monto_total ELSE 0 END), 0),
        'saldo_pendiente', COALESCE(SUM(CASE WHEN estado_pago IN ('Pendiente', 'Parcial') THEN monto_total ELSE 0 END), 0),
        'facturas_pendientes', COUNT(CASE WHEN estado_pago IN ('Pendiente', 'Parcial') THEN 1 END)
      )
      FROM facturas WHERE paciente_id = p_paciente_id AND estado_pago != 'Anulado'
    ),
    'ultimas_facturas', (
      SELECT json_agg(row_to_json(f))
      FROM (
        SELECT id, fecha_emision, monto_total, estado_pago
        FROM facturas
        WHERE paciente_id = p_paciente_id
        ORDER BY fecha_emision DESC
        LIMIT 5
      ) f
    ),
    'proximas_citas', (
      SELECT json_agg(row_to_json(c))
      FROM (
        SELECT id, fecha_hora, motivo, estado
        FROM citas
        WHERE paciente_id = p_paciente_id
          AND fecha_hora >= NOW()
          AND estado = 'Programada'
        ORDER BY fecha_hora
        LIMIT 3
      ) c
    )
  ) INTO v_resultado;
  
  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;