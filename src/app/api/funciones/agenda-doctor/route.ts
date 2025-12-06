import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener agenda de un doctor por rango de fechas
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctor_id');
  const fechaInicio = searchParams.get('fecha_inicio');
  const fechaFin = searchParams.get('fecha_fin');

  if (!doctorId) {
    return NextResponse.json({ error: 'doctor_id es requerido' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('fn_agenda_doctor', {
    p_doctor_id: parseInt(doctorId),
    p_fecha_inicio: fechaInicio || new Date().toISOString().split('T')[0],
    p_fecha_fin: fechaFin || new Date().toISOString().split('T')[0]
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

