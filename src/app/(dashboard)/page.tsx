'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import type { VwCitasHoy, VwFacturasPendientes, VwIngresosMensuales } from '@/types/database';

export default function DashboardPage() {
  const [citasHoy, setCitasHoy] = useState<VwCitasHoy[]>([]);
  const [facturasPendientes, setFacturasPendientes] = useState<VwFacturasPendientes[]>([]);
  const [ingresos, setIngresos] = useState<VwIngresosMensuales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [citasRes, facturasRes, ingresosRes] = await Promise.all([
          fetch('/api/views/citas-hoy'),
          fetch('/api/views/facturas-pendientes'),
          fetch('/api/views/ingresos-mensuales')
        ]);

        if (citasRes.ok) setCitasHoy(await citasRes.json());
        if (facturasRes.ok) setFacturasPendientes(await facturasRes.json());
        if (ingresosRes.ok) setIngresos(await ingresosRes.json());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const mesActual = ingresos[0];
  const totalPendiente = facturasPendientes.reduce((acc, f) => acc + (f.monto_total || 0), 0);

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Resumen general de la clínica" 
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Citas Hoy
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
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Citas de Hoy
              </CardTitle>
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

