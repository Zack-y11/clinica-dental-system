import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { DetalleFacturaInsert, DetalleFacturaUpdate } from '@/types/database';

// GET - Obtener detalles de una factura
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const facturaId = searchParams.get('factura_id');

  if (!facturaId) {
    return NextResponse.json({ error: 'factura_id es requerido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('detalle_factura')
    .select('*')
    .eq('factura_id', parseInt(facturaId))
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Agregar detalle a factura
export async function POST(request: NextRequest) {
  const body: DetalleFacturaInsert = await request.json();

  const { data, error } = await supabase
    .from('detalle_factura')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar detalle de factura
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const body: DetalleFacturaUpdate = await request.json();

  const { data, error } = await supabase
    .from('detalle_factura')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// DELETE - Eliminar detalle de factura
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('detalle_factura')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: 'Detalle eliminado correctamente' });
}

