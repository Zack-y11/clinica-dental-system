'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';
import type { 
  Paciente, 
  EstadoCuentaPaciente, 
  VwHistorialTratamientos,
  VwOdontogramaCompleto 
} from '@/types/database';

export default function PacienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaPaciente | null>(null);
  const [historial, setHistorial] = useState<VwHistorialTratamientos[]>([]);
  const [odontograma, setOdontograma] = useState<VwOdontogramaCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [selectedEstado, setSelectedEstado] = useState<string>('Sano');
  const [savingOdo, setSavingOdo] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pacienteRes, cuentaRes, historialRes, odontogramaRes] = await Promise.all([
          fetch(`/api/pacientes?id=${id}`),
          fetch(`/api/funciones/estado-cuenta/${id}`),
          fetch(`/api/views/historial-tratamientos?paciente_id=${id}`),
          fetch(`/api/views/odontograma-completo/${id}`)
        ]);

        if (pacienteRes.ok) setPaciente(await pacienteRes.json());
        if (cuentaRes.ok) setEstadoCuenta(await cuentaRes.json());
        if (historialRes.ok) setHistorial(await historialRes.json());
        if (odontogramaRes.ok) setOdontograma(await odontogramaRes.json());
      } catch (error) {
        console.error('Error fetching paciente data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header title="Cargando..." />
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!paciente) {
    return (
      <>
        <Header title="Paciente no encontrado" />
        <div className="p-6">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </>
    );
  }

  const estadoColores: Record<string, string> = {
    'Sano': 'bg-green-500',
    'Caries': 'bg-red-500',
    'Ausente': 'bg-gray-400',
    'Corona': 'bg-yellow-500',
    'Obturado': 'bg-blue-500',
    'Endodoncia': 'bg-purple-500',
  };

  const saveOdontograma = async () => {
    if (!selectedTooth || !selectedEstado) {
      toast.error('Selecciona un diente y un estado');
      return;
    }

    setSavingOdo(true);
    try {
      const res = await fetch(
        `/api/odontograma?paciente_id=${id}&diente_numero=${selectedTooth}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: selectedEstado }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo guardar');
      }

      const refreshed = await fetch(`/api/views/odontograma-completo/${id}`);
      if (refreshed.ok) {
        setOdontograma(await refreshed.json());
        toast.success('Odontograma actualizado');
      } else {
        toast.error('Guardado, pero no se pudo refrescar la vista');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error guardando odontograma');
    } finally {
      setSavingOdo(false);
    }
  };

  return (
    <>
      <Header 
        title={`${paciente.nombres} ${paciente.apellidos}`}
        subtitle="Ficha del paciente"
      />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Pacientes
        </Button>

        {/* Patient Info & Account Summary */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Patient Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{paciente.telefono || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{paciente.email || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                    <p className="font-medium">
                      {paciente.fecha_nacimiento 
                        ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es')
                        : 'No registrada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{paciente.direccion || 'No registrada'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Estado de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {estadoCuenta?.resumen && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Facturado</span>
                    <span className="font-bold">${estadoCuenta.resumen.total_facturado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Pagado</span>
                    <span className="font-bold text-green-600">${estadoCuenta.resumen.total_pagado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Saldo Pendiente</span>
                    <span className="font-bold text-amber-600">${estadoCuenta.resumen.saldo_pendiente.toFixed(2)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="historial" className="space-y-4">
          <TabsList>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="odontograma" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Odontograma
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial">
            <Card>
              <CardContent className="p-0">
                {historial.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay tratamientos registrados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tratamiento</TableHead>
                        <TableHead>Diente</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead className="text-right">Costo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historial.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {new Date(item.fecha_cita).toLocaleDateString('es')}
                          </TableCell>
                          <TableCell className="font-medium">{item.tratamiento}</TableCell>
                          <TableCell>
                            {item.diente_afectado ? `#${item.diente_afectado}` : '-'}
                          </TableCell>
                          <TableCell>{item.atendido_por}</TableCell>
                          <TableCell className="text-right">
                            ${item.costo_final?.toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="odontograma">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {Object.entries(estadoColores).map(([estado, color]) => (
                    <div key={estado} className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded ${color}`} />
                      <span className="text-sm">{estado}</span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-4 items-end">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Diente (número)</p>
                    <Input
                      type="number"
                      min={1}
                      max={52}
                      placeholder="Ej. 11 o 26"
                      value={selectedTooth}
                      onChange={(e) => setSelectedTooth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(estadoColores).map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex md:justify-end">
                    <Button onClick={saveOdontograma} disabled={savingOdo}>
                      {savingOdo ? 'Guardando...' : 'Guardar / Actualizar diente'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {['Superior Derecho', 'Superior Izquierdo', 'Inferior Izquierdo', 'Inferior Derecho'].map((cuadrante) => (
                    <div key={cuadrante} className="space-y-2">
                      <p className="text-sm font-medium text-center">{cuadrante}</p>
                      <div className="grid grid-cols-4 gap-1">
                        {odontograma
                          .filter(d => d.cuadrante === cuadrante)
                          .map((diente) => (
                            <div
                              key={diente.diente_numero}
                              className={`h-8 w-8 rounded flex items-center justify-center text-xs font-medium text-white ${estadoColores[diente.estado] || 'bg-gray-300'}`}
                              title={`${diente.diente_numero}: ${diente.estado}`}
                            >
                              {diente.diente_numero}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}


