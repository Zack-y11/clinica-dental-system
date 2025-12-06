import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CatalogoTratamientoInsert, CatalogoTratamientoUpdate } from '@/types/database';

// GET - Obtener catálogo de tratamientos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data, error } = await supabase
      .from('catalogo_tratamientos')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('catalogo_tratamientos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Crear nuevo tratamiento en catálogo
export async function POST(request: NextRequest) {
  const body: CatalogoTratamientoInsert = await request.json();

  const { data, error } = await supabase
    .from('catalogo_tratamientos')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar tratamiento en catálogo
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const body: CatalogoTratamientoUpdate = await request.json();

  const { data, error } = await supabase
    .from('catalogo_tratamientos')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// DELETE - Eliminar tratamiento del catálogo
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('catalogo_tratamientos')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: 'Tratamiento eliminado del catálogo' });
}

