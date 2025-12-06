import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { FacturaInsert, FacturaUpdate } from '@/types/database';
const ESTADOS_VALIDOS = ['Pendiente', 'Pagado', 'Parcial', 'Anulado'];

// GET - Obtener facturas con filtros opcionales
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pacienteId = searchParams.get('paciente_id');
  const estadoPago = searchParams.get('estado_pago');

  let query = supabase
    .from('facturas')
    .select(`
      *,
      pacientes (id, nombres, apellidos, telefono, email),
      citas (id, fecha_hora, motivo)
    `);

  if (id) {
    const { data, error } = await query.eq('id', parseInt(id)).single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  if (pacienteId) {
    query = query.eq('paciente_id', parseInt(pacienteId));
  }

  if (estadoPago) {
    query = query.eq('estado_pago', estadoPago);
  }

  const { data, error } = await query.order('fecha_emision', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Crear nueva factura
export async function POST(request: NextRequest) {
  const body: FacturaInsert = await request.json();

  const { data, error } = await supabase
    .from('facturas')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar factura
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const body: FacturaUpdate = await request.json();

  if (body.estado_pago && !ESTADOS_VALIDOS.includes(body.estado_pago)) {
    return NextResponse.json({ error: 'estado_pago inválido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('facturas')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

