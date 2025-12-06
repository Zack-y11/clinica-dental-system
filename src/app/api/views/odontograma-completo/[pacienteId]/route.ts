import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener odontograma completo de un paciente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pacienteId: string }> }
) {
  const { pacienteId } = await params;

  const { data, error } = await supabase
    .from('vw_odontograma_completo')
    .select('*')
    .eq('paciente_id', parseInt(pacienteId))
    .order('diente_numero', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}


