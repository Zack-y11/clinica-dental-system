import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener citas de hoy
export async function GET() {
  const { data, error } = await supabase
    .from('vw_citas_hoy')
    .select('*')
    .order('fecha_hora', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

