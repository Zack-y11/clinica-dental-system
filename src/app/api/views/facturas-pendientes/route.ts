import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener facturas pendientes de pago
export async function GET() {
  const { data, error } = await supabase
    .from('vw_facturas_pendientes')
    .select('*')
    .order('dias_pendiente', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

