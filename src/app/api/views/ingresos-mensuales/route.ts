import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener resumen de ingresos mensuales
export async function GET() {
  const { data, error } = await supabase
    .from('vw_ingresos_mensuales')
    .select('*')
    .order('mes', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}


