import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Buscar pacientes por término
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const termino = searchParams.get('q');

  if (!termino) {
    return NextResponse.json({ error: 'Término de búsqueda (q) es requerido' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('fn_buscar_pacientes', {
    p_termino: termino
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}


