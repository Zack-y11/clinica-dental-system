import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { OdontogramaInsert, OdontogramaUpdate } from '@/types/database';

// GET - Obtener odontograma de un paciente
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pacienteId = searchParams.get('paciente_id');
  const dienteNumero = searchParams.get('diente_numero');

  if (!pacienteId) {
    return NextResponse.json({ error: 'paciente_id es requerido' }, { status: 400 });
  }

  let query = supabase
    .from('odontograma')
    .select('*')
    .eq('paciente_id', parseInt(pacienteId));

  if (dienteNumero) {
    query = query.eq('diente_numero', parseInt(dienteNumero));
    const { data, error } = await query.single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await query.order('diente_numero', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Crear registro de odontograma
export async function POST(request: NextRequest) {
  const body: OdontogramaInsert = await request.json();

  const { data, error } = await supabase
    .from('odontograma')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar estado de un diente
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pacienteId = searchParams.get('paciente_id');
  const dienteNumero = searchParams.get('diente_numero');

  if (!pacienteId || !dienteNumero) {
    return NextResponse.json({ error: 'paciente_id y diente_numero son requeridos' }, { status: 400 });
  }

  const body: OdontogramaUpdate = await request.json();

  // Usar upsert para crear o actualizar
  const { data, error } = await supabase
    .from('odontograma')
    .upsert({
      paciente_id: parseInt(pacienteId),
      diente_numero: parseInt(dienteNumero),
      ...body,
      fecha_actualizacion: new Date().toISOString().split('T')[0]
    }, {
      onConflict: 'paciente_id,diente_numero'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

