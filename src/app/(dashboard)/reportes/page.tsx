'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Users,
  Calendar,
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { VwIngresosMensuales, ReporteProduccionDoctor } from '@/types/database';

export default function ReportesPage() {
  const [ingresosMensuales, setIngresosMensuales] = useState<VwIngresosMensuales[]>([]);
  const [produccionDoctores, setProduccionDoctores] = useState<ReporteProduccionDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const fetchIngresos = useCallback(async () => {
    try {
      const res = await fetch('/api/views/ingresos-mensuales');
      if (res.ok) {
        setIngresosMensuales(await res.json());
      }
    } catch (error) {
      console.error('Error fetching ingresos:', error);
      toast.error('Error al cargar ingresos');
    }
  }, []);

  const fetchProduccion = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/funciones/reporte-produccion?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      );
      if (res.ok) {
        setProduccionDoctores(await res.json());
      }
    } catch (error) {
      console.error('Error fetching produccion:', error);
      toast.error('Error al cargar producción');
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    Promise.all([fetchIngresos(), fetchProduccion()]).finally(() => setLoading(false));
  }, [fetchIngresos, fetchProduccion]);

  const handleFilterProduccion = () => {
    setLoading(true);
    fetchProduccion().finally(() => setLoading(false));
  };

  // Calcular totales de ingresos
  const totalIngresosCobrados = ingresosMensuales.reduce((acc, m) => acc + (m.ingresos_cobrados || 0), 0);
  const totalIngresosPendientes = ingresosMensuales.reduce((acc, m) => acc + (m.ingresos_pendientes || 0), 0);
  const totalFacturas = ingresosMensuales.reduce((acc, m) => acc + m.total_facturas, 0);
  const totalPacientes = ingresosMensuales.reduce((acc, m) => acc + m.pacientes_atendidos, 0);

  // Calcular totales de producción
  const totalProduccionFacturado = produccionDoctores.reduce((acc, d) => acc + (d.total_facturado || 0), 0);
  const totalProduccionCobrado = produccionDoctores.reduce((acc, d) => acc + (d.total_cobrado || 0), 0);
  const totalCitasCompletadas = produccionDoctores.reduce((acc, d) => acc + d.citas_completadas, 0);

  return (
    <>
      <Header 
        title="Reportes" 
        subtitle="Análisis e informes financieros" 
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cobrado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalIngresosCobrados.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Histórico</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Por Cobrar
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${totalIngresosPendientes.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Pendiente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Facturas Emitidas
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFacturas}</div>
              <p className="text-xs text-muted-foreground">Total histórico</p>
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
              <div className="text-2xl font-bold">{totalPacientes}</div>
              <p className="text-xs text-muted-foreground">Total histórico</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ingresos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ingresos" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Ingresos Mensuales
            </TabsTrigger>
            <TabsTrigger value="produccion" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Producción por Doctor
            </TabsTrigger>
          </TabsList>

          {/* Ingresos Mensuales */}
          <TabsContent value="ingresos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Resumen de Ingresos por Mes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 space-y-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : ingresosMensuales.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay datos de ingresos
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mes</TableHead>
                            <TableHead className="text-center">Facturas</TableHead>
                            <TableHead className="text-center">Pacientes</TableHead>
                            <TableHead className="text-right">Cobrado</TableHead>
                            <TableHead className="text-right">Pendiente</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ingresosMensuales.map((mes) => (
                            <TableRow key={mes.mes}>
                              <TableCell className="font-medium">
                                {format(new Date(mes.mes + '-01'), 'MMMM yyyy', { locale: es })}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{mes.total_facturas}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{mes.pacientes_atendidos}</Badge>
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                ${mes.ingresos_cobrados?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell className="text-right text-amber-600 font-medium">
                                ${mes.ingresos_pendientes?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                ${mes.ingresos_totales?.toFixed(2) || '0.00'}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 border-t-2">
                            <TableCell className="font-bold">Totales</TableCell>
                            <TableCell className="text-center font-bold">{totalFacturas}</TableCell>
                            <TableCell className="text-center font-bold">{totalPacientes}</TableCell>
                            <TableCell className="text-right text-green-600 font-bold">
                              ${totalIngresosCobrados.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-amber-600 font-bold">
                              ${totalIngresosPendientes.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              ${(totalIngresosCobrados + totalIngresosPendientes).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden p-4 space-y-3">
                      {ingresosMensuales.map((mes) => (
                        <div
                          key={mes.mes}
                          className="rounded-lg border bg-muted/40 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Mes</p>
                              <p className="font-semibold">
                                {format(new Date(mes.mes + '-01'), 'MMMM yyyy', { locale: es })}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-xs text-muted-foreground">Facturas</p>
                              <Badge variant="outline">{mes.total_facturas}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pacientes</span>
                            <Badge variant="secondary">{mes.pacientes_atendidos}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Cobrado</p>
                              <p className="font-semibold text-green-600">
                                ${mes.ingresos_cobrados?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-muted-foreground">Pendiente</p>
                              <p className="font-semibold text-amber-600">
                                ${mes.ingresos_pendientes?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-lg font-bold">
                              ${mes.ingresos_totales?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="rounded-lg border bg-muted/60 p-4 space-y-2">
                        <p className="text-sm font-semibold">Totales</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Facturas</span>
                          <span className="text-right font-bold">{totalFacturas}</span>
                          <span className="text-muted-foreground">Pacientes</span>
                          <span className="text-right font-bold">{totalPacientes}</span>
                          <span className="text-muted-foreground">Cobrado</span>
                          <span className="text-right font-bold text-green-600">
                            ${totalIngresosCobrados.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">Pendiente</span>
                          <span className="text-right font-bold text-amber-600">
                            ${totalIngresosPendientes.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-lg font-bold">
                            ${(totalIngresosCobrados + totalIngresosPendientes).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Producción por Doctor */}
          <TabsContent value="produccion">
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin</Label>
                    <Input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleFilterProduccion}>
                    Filtrar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Producción por Doctor
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {format(new Date(fechaInicio), 'dd/MM/yyyy')} - {format(new Date(fechaFin), 'dd/MM/yyyy')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : produccionDoctores.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay datos de producción para el período seleccionado
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Especialidad</TableHead>
                            <TableHead className="text-center">Citas Completadas</TableHead>
                            <TableHead className="text-center">Citas Canceladas</TableHead>
                            <TableHead className="text-right">Facturado</TableHead>
                            <TableHead className="text-right">Cobrado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {produccionDoctores.map((doctor) => (
                            <TableRow key={doctor.doctor_id}>
                              <TableCell className="font-medium">{doctor.doctor_nombre}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{doctor.especialidad || 'General'}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-green-500">{doctor.citas_completadas}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="destructive">{doctor.citas_canceladas}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${doctor.total_facturado?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                ${doctor.total_cobrado?.toFixed(2) || '0.00'}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 border-t-2">
                            <TableCell colSpan={2} className="font-bold">Totales</TableCell>
                            <TableCell className="text-center font-bold">{totalCitasCompletadas}</TableCell>
                            <TableCell className="text-center font-bold">
                              {produccionDoctores.reduce((acc, d) => acc + d.citas_canceladas, 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              ${totalProduccionFacturado.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-bold">
                              ${totalProduccionCobrado.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden p-4 space-y-3">
                      {produccionDoctores.map((doctor) => (
                        <div
                          key={doctor.doctor_id}
                          className="rounded-lg border bg-muted/40 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold leading-tight">{doctor.doctor_nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {doctor.especialidad || 'General'}
                              </p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <p>Completadas</p>
                              <Badge className="bg-green-500">{doctor.citas_completadas}</Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Canceladas</span>
                            <Badge variant="destructive">{doctor.citas_canceladas}</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Facturado</p>
                              <p className="font-semibold">
                                ${doctor.total_facturado?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-muted-foreground">Cobrado</p>
                              <p className="font-semibold text-green-600">
                                ${doctor.total_cobrado?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="rounded-lg border bg-muted/60 p-4 space-y-2">
                        <p className="text-sm font-semibold">Totales</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Completadas</span>
                          <span className="text-right font-bold">{totalCitasCompletadas}</span>
                          <span className="text-muted-foreground">Canceladas</span>
                          <span className="text-right font-bold">
                            {produccionDoctores.reduce((acc, d) => acc + d.citas_canceladas, 0)}
                          </span>
                          <span className="text-muted-foreground">Facturado</span>
                          <span className="text-right font-bold">
                            ${totalProduccionFacturado.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">Cobrado</span>
                          <span className="text-right font-bold text-green-600">
                            ${totalProduccionCobrado.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

