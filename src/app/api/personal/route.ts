import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { PersonalInsert, PersonalUpdate } from '@/types/database';

// GET - Obtener todo el personal o uno específico
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const cargo = searchParams.get('cargo');

  let query = supabase.from('personal').select('*');

  if (id) {
    const { data, error } = await query.eq('id', parseInt(id)).single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  if (cargo) {
    query = query.eq('cargo', cargo);
  }

  const { data, error } = await query.order('nombre_completo', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Crear nuevo personal
export async function POST(request: NextRequest) {
  const body: PersonalInsert = await request.json();

  const { data, error } = await supabase
    .from('personal')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar personal
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const body: PersonalUpdate = await request.json();

  const { data, error } = await supabase
    .from('personal')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// DELETE - Eliminar personal
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('personal')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: 'Personal eliminado correctamente' });
}


