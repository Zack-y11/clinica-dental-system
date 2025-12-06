import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RangeType = 'day' | 'week';

// GET - Obtener citas de hoy o de la semana (?range=week)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') as RangeType) || 'day';

  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0); // inicio local del día
  const end = new Date(start);
  end.setDate(end.getDate() + (range === 'week' ? 7 : 1)); // fin local

  const { data, error } = await supabase
    .from('citas')
    .select(
      `
      cita_id:id,
      fecha_hora,
      motivo,
      estado,
      paciente_id,
      pacientes (id, nombres, apellidos, telefono),
      doctor_id:doctor_id,
      personal (id, nombre_completo, especialidad)
    `
    )
    .gte('fecha_hora', start.toISOString())
    .lt('fecha_hora', end.toISOString())
    .order('fecha_hora', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data || []).map((row: any) => ({
    cita_id: row.cita_id,
    fecha_hora: row.fecha_hora,
    motivo: row.motivo,
    estado: row.estado,
    paciente_id: row.paciente_id,
    paciente_nombre: row.pacientes ? `${row.pacientes.nombres} ${row.pacientes.apellidos}` : '',
    paciente_telefono: row.pacientes?.telefono || null,
    doctor_id: row.personal?.id || null,
    doctor_nombre: row.personal?.nombre_completo || '',
    doctor_especialidad: row.personal?.especialidad || null,
  }));

  return NextResponse.json(mapped);
}

