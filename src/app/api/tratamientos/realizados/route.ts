import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { TratamientoRealizadoInsert, TratamientoRealizadoUpdate } from '@/types/database';

// GET - Obtener tratamientos realizados
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const citaId = searchParams.get('cita_id');

  let query = supabase
    .from('tratamientos_realizados')
    .select(`
      *,
      catalogo_tratamientos (id, nombre, costo_base)
    `);

  if (id) {
    const { data, error } = await query.eq('id', parseInt(id)).single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  if (citaId) {
    query = query.eq('cita_id', parseInt(citaId));
  }

  const { data, error } = await query.order('id', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Registrar tratamiento realizado
export async function POST(request: NextRequest) {
  const body: TratamientoRealizadoInsert = await request.json();

  const { data, error } = await supabase
    .from('tratamientos_realizados')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar tratamiento realizado
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const body: TratamientoRealizadoUpdate = await request.json();

  const { data, error } = await supabase
    .from('tratamientos_realizados')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// DELETE - Eliminar tratamiento realizado
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('tratamientos_realizados')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: 'Tratamiento eliminado correctamente' });
}


