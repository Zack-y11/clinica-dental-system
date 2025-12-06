import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener estado de cuenta de un paciente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pacienteId: string }> }
) {
  const { pacienteId } = await params;

  const { data, error } = await supabase.rpc('fn_estado_cuenta_paciente', {
    p_paciente_id: parseInt(pacienteId)
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

