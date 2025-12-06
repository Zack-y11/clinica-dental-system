import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Agendar cita con validaciones
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paciente_id, doctor_id, fecha_hora, motivo } = body;

  if (!paciente_id || !doctor_id || !fecha_hora || !motivo) {
    return NextResponse.json({ 
      error: 'paciente_id, doctor_id, fecha_hora y motivo son requeridos' 
    }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('fn_agendar_cita', {
    p_paciente_id: paciente_id,
    p_doctor_id: doctor_id,
    p_fecha_hora: fecha_hora,
    p_motivo: motivo
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // La función devuelve un JSON con success, cita_id/error, message
  if (data && !data.success) {
    return NextResponse.json(data, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}

