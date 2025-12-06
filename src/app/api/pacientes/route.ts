import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { PacienteInsert, PacienteUpdate } from '@/types/database';

// GET - Obtener todos los pacientes o uno específico
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('apellidos', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Crear nuevo paciente
export async function POST(request: NextRequest) {
  const body: PacienteInsert = await request.json();

  const { data, error } = await supabase
    .from('pacientes')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar paciente
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const body: PacienteUpdate = await request.json();

  const { data, error } = await supabase
    .from('pacientes')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// DELETE - Eliminar paciente
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: 'Paciente eliminado correctamente' });
}


