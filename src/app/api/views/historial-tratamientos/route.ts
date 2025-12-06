import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener historial de tratamientos (opcionalmente filtrado por paciente)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pacienteId = searchParams.get('paciente_id');

  let query = supabase
    .from('vw_historial_tratamientos')
    .select('*');

  if (pacienteId) {
    query = query.eq('paciente_id', parseInt(pacienteId));
  }

  const { data, error } = await query.order('fecha_cita', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}


