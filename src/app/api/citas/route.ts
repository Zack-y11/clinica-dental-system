import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CitaInsert, CitaUpdate } from '@/types/database';

// GET - Obtener citas con filtros opcionales
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const pacienteId = searchParams.get('paciente_id');
  const doctorId = searchParams.get('doctor_id');
  const estado = searchParams.get('estado');
  const fecha = searchParams.get('fecha');

  let query = supabase
    .from('citas')
    .select(`
      *,
      pacientes (id, nombres, apellidos, telefono),
      personal (id, nombre_completo, especialidad)
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

  if (doctorId) {
    query = query.eq('doctor_id', parseInt(doctorId));
  }

  if (estado) {
    query = query.eq('estado', estado);
  }

  if (fecha) {
    query = query.gte('fecha_hora', `${fecha}T00:00:00`).lte('fecha_hora', `${fecha}T23:59:59`);
  }

  const { data, error } = await query.order('fecha_hora', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST - Crear nueva cita
// Soporta dos flujos:
// - Directo a tabla (existente)
// - Validado vía RPC fn_agendar_cita si ?use_rpc=true (respeta reglas de agenda)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const useRpc = searchParams.get('use_rpc') === 'true';
  const body: CitaInsert = await request.json();

  if (useRpc) {
    const { paciente_id, doctor_id, fecha_hora, motivo } = body as any;
    if (!paciente_id || !doctor_id || !fecha_hora || !motivo) {
      return NextResponse.json(
        { error: 'paciente_id, doctor_id, fecha_hora y motivo son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('fn_agendar_cita', {
      p_paciente_id: paciente_id,
      p_doctor_id: doctor_id,
      p_fecha_hora: fecha_hora,
      p_motivo: motivo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && !data.success) {
      return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  }

  const { data, error } = await supabase
    .from('citas')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT - Actualizar cita
// Permite validación de conflictos si ?validate=true (mismo criterio de fn_agendar_cita)
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const shouldValidate = searchParams.get('validate') === 'true' || searchParams.get('use_rpc') === 'true';

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const body: CitaUpdate = await request.json();

  if (shouldValidate && body.doctor_id && body.fecha_hora) {
    const citaId = parseInt(id);
    const nuevaFecha = new Date(body.fecha_hora);
    if (Number.isNaN(nuevaFecha.getTime())) {
      return NextResponse.json({ error: 'fecha_hora inválida' }, { status: 400 });
    }

    const ventanaInicio = new Date(nuevaFecha.getTime() - 29 * 60 * 1000).toISOString();
    const ventanaFin = new Date(nuevaFecha.getTime() + 29 * 60 * 1000).toISOString();
    // Conflicto doctor
    const { data: conflictosDoctor, error: errDoctor } = await supabase
      .from('citas')
      .select('id')
      .eq('doctor_id', body.doctor_id)
      .neq('estado', 'Cancelada')
      .neq('id', citaId)
      .gte('fecha_hora', ventanaInicio)
      .lte('fecha_hora', ventanaFin)
      .limit(1);

    if (errDoctor) {
      return NextResponse.json({ error: errDoctor.message }, { status: 500 });
    }
    if (conflictosDoctor && conflictosDoctor.length > 0) {
      return NextResponse.json(
        { success: false, error: 'El doctor ya tiene una cita programada en ese horario' },
        { status: 400 }
      );
    }

    // Conflicto paciente mismo día
    if (body.paciente_id) {
      const fechaStr = nuevaFecha.toISOString().split('T')[0];
      const { data: conflictoPaciente, error: errPaciente } = await supabase
        .from('citas')
        .select('id')
        .eq('paciente_id', body.paciente_id)
        .neq('estado', 'Cancelada')
        .neq('id', citaId)
        .gte('fecha_hora', `${fechaStr}T00:00:00`)
        .lte('fecha_hora', `${fechaStr}T23:59:59`)
        .limit(1);

      if (errPaciente) {
        return NextResponse.json({ error: errPaciente.message }, { status: 500 });
      }
      if (conflictoPaciente && conflictoPaciente.length > 0) {
        return NextResponse.json(
          { success: false, error: 'El paciente ya tiene una cita programada para ese día' },
          { status: 400 }
        );
      }
    }
  }

  const { data, error } = await supabase
    .from('citas')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

// DELETE - Eliminar cita
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
  }

  const { error } = await supabase
    .from('citas')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ message: 'Cita eliminada correctamente' });
}

