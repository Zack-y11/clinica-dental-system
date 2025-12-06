import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Obtener reporte de producción por doctor
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fechaInicio = searchParams.get('fecha_inicio');
  const fechaFin = searchParams.get('fecha_fin');

  if (!fechaInicio || !fechaFin) {
    return NextResponse.json({ 
      error: 'fecha_inicio y fecha_fin son requeridos' 
    }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('fn_reporte_produccion_doctor', {
    p_fecha_inicio: fechaInicio,
    p_fecha_fin: fechaFin
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

