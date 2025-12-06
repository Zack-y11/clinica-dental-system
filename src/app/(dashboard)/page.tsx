'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  Bell
} from 'lucide-react';
import type { VwCitasHoy, VwFacturasPendientes, VwIngresosMensuales } from '@/types/database';

export default function DashboardPage() {
  const [citasHoy, setCitasHoy] = useState<VwCitasHoy[]>([]);
  const [citasAlert, setCitasAlert] = useState<VwCitasHoy[]>([]);
  const [facturasPendientes, setFacturasPendientes] = useState<VwFacturasPendientes[]>([]);
  const [ingresos, setIngresos] = useState<VwIngresosMensuales[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'day' | 'week'>('day');

  const fetchCitas = useCallback(
    async (currentRange: 'day' | 'week') => {
      const res = await fetch(`/api/views/citas-hoy?range=${currentRange}`);
      if (res.ok) setCitasHoy(await res.json());
    },
    []
  );

  const fetchCitasAlert = useCallback(async () => {
    const res = await fetch('/api/views/citas-hoy?range=day');
    if (res.ok) {
      const data: VwCitasHoy[] = await res.json();
      setCitasAlert(data.filter((c) => c.estado !== 'Completada'));
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [facturasRes, ingresosRes] = await Promise.all([
          fetch('/api/views/facturas-pendientes'),
          fetch('/api/views/ingresos-mensuales')
        ]);

        if (facturasRes.ok) setFacturasPendientes(await facturasRes.json());
        if (ingresosRes.ok) setIngresos(await ingresosRes.json());
        await fetchCitas(range);
        await fetchCitasAlert();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [fetchCitas, fetchCitasAlert, range]);

  // Cambiar rango de citas
  useEffect(() => {
    fetchCitas(range);
  }, [fetchCitas, range]);

  const mesActual = ingresos[0];
  const totalPendiente = facturasPendientes.reduce((acc, f) => acc + (f.monto_total || 0), 0);

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Resumen general de la clínica" 
      />
      
      <div className="p-6 space-y-6">
        {/* Alerta de citas del día pendientes */}
        {citasAlert.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-amber-900">
                Tienes {citasAlert.length} cita(s) hoy sin completar
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-amber-800">
                {citasAlert.slice(0, 3).map((cita) => (
                  <span key={cita.cita_id} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 border border-amber-200">
                    <strong>{new Date(cita.fecha_hora).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</strong>
                    · {cita.paciente_nombre}
                    {cita.doctor_nombre ? ` · ${cita.doctor_nombre}` : ''}
                  </span>
                ))}
                {citasAlert.length > 3 && (
                  <span className="text-xs text-amber-700">
                    +{citasAlert.length - 3} más
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Citas ({range === 'day' ? 'Hoy' : 'Semana'})
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{citasHoy.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {citasHoy.filter(c => c.estado === 'Programada').length} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos del Mes
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${mesActual?.ingresos_cobrados?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mesActual?.total_facturas || 0} facturas emitidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendiente por Cobrar
              </CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                ${totalPendiente.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {facturasPendientes.length} facturas pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pacientes Atendidos
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mesActual?.pacientes_atendidos || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Citas de Hoy */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {range === 'day' ? 'Citas de Hoy' : 'Citas de la Semana'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Rango</span>
                  <select
                    className="border rounded px-2 py-1 text-sm bg-background"
                    value={range}
                    onChange={(e) => setRange(e.target.value as 'day' | 'week')}
                  >
                    <option value="day">Hoy</option>
                    <option value="week">Semana</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : citasHoy.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay citas programadas para hoy
                </p>
              ) : (
                <div className="space-y-3">
                  {citasHoy.slice(0, 5).map((cita) => (
                    <div
                      key={cita.cita_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{cita.paciente_nombre}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {cita.motivo} • {cita.doctor_nombre}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm font-medium">
                          {new Date(cita.fecha_hora).toLocaleTimeString('es', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <Badge variant={
                          cita.estado === 'Completada' ? 'default' :
                          cita.estado === 'Cancelada' ? 'destructive' : 'secondary'
                        }>
                          {cita.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facturas Pendientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Facturas Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : facturasPendientes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay facturas pendientes
                </p>
              ) : (
                <div className="space-y-3">
                  {facturasPendientes.slice(0, 5).map((factura) => (
                    <div
                      key={factura.factura_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{factura.paciente_nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {factura.dias_pendiente} días pendiente
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-lg font-bold text-amber-600">
                          ${factura.monto_total?.toFixed(2)}
                        </span>
                        <Badge variant={factura.estado_pago === 'Parcial' ? 'secondary' : 'outline'}>
                          {factura.estado_pago}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

