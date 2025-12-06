// Tipos TypeScript basados en el esquema SQL de la clínica dental

export interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ultima_visita: string | null;
}

export interface Personal {
  id: number;
  nombre_completo: string;
  cargo: 'Odontologo' | 'Asistente' | 'Recepcion';
  especialidad: string | null;
  no_licencia: string | null;
}

export interface CatalogoTratamiento {
  id: number;
  nombre: string;
  descripcion: string | null;
  costo_base: number | null;
}

export interface Cita {
  id: number;
  paciente_id: number;
  doctor_id: number | null;
  fecha_hora: string;
  motivo: string | null;
  estado: 'Programada' | 'Completada' | 'Cancelada';
}

export interface TratamientoRealizado {
  id: number;
  cita_id: number;
  tratamiento_id: number | null;
  diente_afectado: number | null;
  costo_final: number | null;
  notas: string | null;
}

export interface Odontograma {
  id: number;
  paciente_id: number;
  diente_numero: number;
  estado: 'Sano' | 'Caries' | 'Ausente' | 'Corona' | 'Obturado' | 'Endodoncia';
  fecha_actualizacion: string;
}

export interface Factura {
  id: number;
  cita_id: number | null;
  paciente_id: number;
  fecha_emision: string;
  monto_total: number | null;
  estado_pago: 'Pendiente' | 'Pagado' | 'Parcial' | 'Anulado';
}

export interface DetalleFactura {
  id: number;
  factura_id: number;
  descripcion: string | null;
  monto: number | null;
}

// Tipos para inserción (sin id)
export type PacienteInsert = Omit<Paciente, 'id'>;
export type PersonalInsert = Omit<Personal, 'id'>;
export type CatalogoTratamientoInsert = Omit<CatalogoTratamiento, 'id'>;
export type CitaInsert = Omit<Cita, 'id'>;
export type TratamientoRealizadoInsert = Omit<TratamientoRealizado, 'id'>;
export type OdontogramaInsert = Omit<Odontograma, 'id'>;
export type FacturaInsert = Omit<Factura, 'id'>;
export type DetalleFacturaInsert = Omit<DetalleFactura, 'id'>;

// Tipos para actualización (parciales sin id)
export type PacienteUpdate = Partial<PacienteInsert>;
export type PersonalUpdate = Partial<PersonalInsert>;
export type CatalogoTratamientoUpdate = Partial<CatalogoTratamientoInsert>;
export type CitaUpdate = Partial<CitaInsert>;
export type TratamientoRealizadoUpdate = Partial<TratamientoRealizadoInsert>;
export type OdontogramaUpdate = Partial<OdontogramaInsert>;
export type FacturaUpdate = Partial<FacturaInsert>;
export type DetalleFacturaUpdate = Partial<DetalleFacturaInsert>;

// Tipos para las Views
export interface VwCitasHoy {
  cita_id: number;
  fecha_hora: string;
  motivo: string | null;
  estado: string;
  paciente_id: number;
  paciente_nombre: string;
  paciente_telefono: string | null;
  doctor_id: number;
  doctor_nombre: string;
  doctor_especialidad: string | null;
}

export interface VwHistorialTratamientos {
  paciente_id: number;
  paciente_nombre: string;
  fecha_cita: string;
  tratamiento: string;
  diente_afectado: number | null;
  costo_final: number | null;
  notas: string | null;
  atendido_por: string;
}

export interface VwFacturasPendientes {
  factura_id: number;
  fecha_emision: string;
  monto_total: number | null;
  estado_pago: string;
  paciente_id: number;
  paciente_nombre: string;
  telefono: string | null;
  email: string | null;
  dias_pendiente: number;
}

export interface VwIngresosMensuales {
  mes: string;
  total_facturas: number;
  pacientes_atendidos: number;
  ingresos_cobrados: number;
  ingresos_pendientes: number;
  ingresos_totales: number;
}

export interface VwOdontogramaCompleto {
  paciente_id: number;
  paciente_nombre: string;
  diente_numero: number;
  cuadrante: string;
  estado: string;
  fecha_actualizacion: string | null;
}

// Tipos para respuestas de funciones
export interface AgendaDoctor {
  cita_id: number;
  fecha_hora: string;
  paciente_nombre: string;
  paciente_telefono: string | null;
  motivo: string | null;
  estado: string;
}

export interface BusquedaPaciente {
  id: number;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  ultima_visita: string | null;
}

export interface ReporteProduccionDoctor {
  doctor_id: number;
  doctor_nombre: string;
  especialidad: string | null;
  citas_completadas: number;
  citas_canceladas: number;
  total_facturado: number;
  total_cobrado: number;
}

export interface EstadoCuentaPaciente {
  paciente: {
    id: number;
    nombre: string;
    telefono: string | null;
    email: string | null;
  };
  resumen: {
    total_facturado: number;
    total_pagado: number;
    saldo_pendiente: number;
    facturas_pendientes: number;
  };
  ultimas_facturas: Array<{
    id: number;
    fecha_emision: string;
    monto_total: number;
    estado_pago: string;
  }> | null;
  proximas_citas: Array<{
    id: number;
    fecha_hora: string;
    motivo: string;
    estado: string;
  }> | null;
}

export interface AgendarCitaResponse {
  success: boolean;
  cita_id?: number;
  message?: string;
  error?: string;
}

// Tipo Database para Supabase
export interface Database {
  public: {
    Tables: {
      pacientes: {
        Row: Paciente;
        Insert: PacienteInsert;
        Update: PacienteUpdate;
      };
      personal: {
        Row: Personal;
        Insert: PersonalInsert;
        Update: PersonalUpdate;
      };
      catalogo_tratamientos: {
        Row: CatalogoTratamiento;
        Insert: CatalogoTratamientoInsert;
        Update: CatalogoTratamientoUpdate;
      };
      citas: {
        Row: Cita;
        Insert: CitaInsert;
        Update: CitaUpdate;
      };
      tratamientos_realizados: {
        Row: TratamientoRealizado;
        Insert: TratamientoRealizadoInsert;
        Update: TratamientoRealizadoUpdate;
      };
      odontograma: {
        Row: Odontograma;
        Insert: OdontogramaInsert;
        Update: OdontogramaUpdate;
      };
      facturas: {
        Row: Factura;
        Insert: FacturaInsert;
        Update: FacturaUpdate;
      };
      detalle_factura: {
        Row: DetalleFactura;
        Insert: DetalleFacturaInsert;
        Update: DetalleFacturaUpdate;
      };
    };
    Views: {
      vw_citas_hoy: {
        Row: VwCitasHoy;
      };
      vw_historial_tratamientos: {
        Row: VwHistorialTratamientos;
      };
      vw_facturas_pendientes: {
        Row: VwFacturasPendientes;
      };
      vw_ingresos_mensuales: {
        Row: VwIngresosMensuales;
      };
      vw_odontograma_completo: {
        Row: VwOdontogramaCompleto;
      };
    };
    Functions: {
      fn_agenda_doctor: {
        Args: {
          p_doctor_id: number;
          p_fecha_inicio?: string;
          p_fecha_fin?: string;
        };
        Returns: AgendaDoctor[];
      };
      fn_buscar_pacientes: {
        Args: {
          p_termino: string;
        };
        Returns: BusquedaPaciente[];
      };
      fn_reporte_produccion_doctor: {
        Args: {
          p_fecha_inicio: string;
          p_fecha_fin: string;
        };
        Returns: ReporteProduccionDoctor[];
      };
      fn_agendar_cita: {
        Args: {
          p_paciente_id: number;
          p_doctor_id: number;
          p_fecha_hora: string;
          p_motivo: string;
        };
        Returns: AgendarCitaResponse;
      };
      fn_estado_cuenta_paciente: {
        Args: {
          p_paciente_id: number;
        };
        Returns: EstadoCuentaPaciente;
      };
    };
  };
}


