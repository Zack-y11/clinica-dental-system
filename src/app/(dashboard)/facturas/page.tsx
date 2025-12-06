'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, 
  Search, 
  FileText, 
  DollarSign, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Paciente, FacturaInsert, VwFacturasPendientes, DetalleFactura, CatalogoTratamiento } from '@/types/database';

interface FacturaConRelaciones {
  id: number;
  cita_id: number | null;
  paciente_id: number;
  fecha_emision: string;
  monto_total: number | null;
  estado_pago: string;
  pacientes: { id: number; nombres: string; apellidos: string; telefono: string | null; email: string | null } | null;
  citas: { id: number; fecha_hora: string; motivo: string | null } | null;
}

const initialFormState: FacturaInsert = {
  paciente_id: 0,
  cita_id: null,
  fecha_emision: new Date().toISOString(),
  monto_total: 0,
  estado_pago: 'Pendiente',
};

const initialNuevoDetalle = {
  tratamientoId: '',
  descripcion: '',
  monto: '',
  extra: '',
};

type NuevoDetalle = typeof initialNuevoDetalle;

const calcDetalleTotal = (d: NuevoDetalle) =>
  (parseFloat(d.monto || '0') || 0) + (parseFloat(d.extra || '0') || 0);

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<FacturaConRelaciones[]>([]);
  const [facturasPendientes, setFacturasPendientes] = useState<VwFacturasPendientes[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<CatalogoTratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FacturaInsert>(initialFormState);
  const [nuevoDetalle, setNuevoDetalle] = useState({ ...initialNuevoDetalle });
  const [detallesNuevos, setDetallesNuevos] = useState<NuevoDetalle[]>([]);
  const [selectedFactura, setSelectedFactura] = useState<FacturaConRelaciones | null>(null);
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false);
  const [detalleForm, setDetalleForm] = useState({
    tratamientoId: '',
    descripcion: '',
    monto: '',
    extra: '',
  });

  const fetchFacturas = useCallback(async () => {
    try {
      const [facturasRes, pendientesRes] = await Promise.all([
        fetch('/api/facturas'),
        fetch('/api/views/facturas-pendientes')
      ]);
      if (facturasRes.ok) setFacturas(await facturasRes.json());
      if (pendientesRes.ok) setFacturasPendientes(await pendientesRes.json());
    } catch (error) {
      console.error('Error fetching facturas:', error);
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPacientes = useCallback(async () => {
    try {
      const res = await fetch('/api/pacientes');
      if (res.ok) setPacientes(await res.json());
    } catch (error) {
      console.error('Error fetching pacientes:', error);
    }
  }, []);

  const fetchTratamientos = useCallback(async () => {
    try {
      const res = await fetch('/api/tratamientos/catalogo');
      if (res.ok) setTratamientos(await res.json());
    } catch (error) {
      console.error('Error fetching tratamientos:', error);
    }
  }, []);

  useEffect(() => {
    fetchFacturas();
    fetchPacientes();
    fetchTratamientos();
  }, [fetchFacturas, fetchPacientes, fetchTratamientos]);

  const filteredFacturas = facturas.filter(f => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      f.pacientes?.nombres.toLowerCase().includes(term) ||
      f.pacientes?.apellidos.toLowerCase().includes(term) ||
      f.id.toString().includes(term);
    
    const matchesEstado = filterEstado === 'todos' || f.estado_pago === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paciente_id) {
      toast.error('Seleccione un paciente');
      return;
    }

    // Si no hay lista, intentar armar una línea con el formulario
    const detallesAEnviar =
      detallesNuevos.length > 0
        ? detallesNuevos
        : (() => {
            const total = calcDetalleTotal(nuevoDetalle);
            if (!nuevoDetalle.descripcion && !nuevoDetalle.tratamientoId) return [];
            if (!total || total <= 0) return [];
            return [nuevoDetalle];
          })();

    if (detallesAEnviar.length === 0) {
      toast.error('Agrega al menos un tratamiento a la factura');
      return;
    }

    const totalCalculado = detallesAEnviar.reduce((acc, d) => acc + calcDetalleTotal(d), 0);
    const payload: FacturaInsert = {
      ...formData,
      monto_total: totalCalculado > 0 ? parseFloat(totalCalculado.toFixed(2)) : formData.monto_total,
    };

    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        // Crear cada detalle
        await Promise.all(
          detallesAEnviar.map(async (d) => {
            const descripcion =
              d.descripcion ||
              tratamientos.find((t) => t.id.toString() === d.tratamientoId)?.nombre ||
              'Detalle';
            const monto = parseFloat(calcDetalleTotal(d).toFixed(2));
            await fetch('/api/facturas/detalle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                factura_id: created.id,
                descripcion,
                monto,
              }),
            });
          })
        );

        toast.success('Factura creada');
        handleDialogClose();
        fetchFacturas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear factura');
      }
    } catch (error) {
      console.error('Error creating factura:', error);
      toast.error('Error al crear factura');
    }
  };

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/facturas?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_pago: nuevoEstado }),
      });

      if (res.ok) {
        toast.success('Estado actualizado');
        setSelectedFactura((prev) =>
          prev && prev.id === id ? { ...prev, estado_pago: nuevoEstado as any } : prev
        );
        fetchFacturas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error updating factura:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const fetchDetalles = useCallback(
    async (facturaId: number) => {
      const res = await fetch(`/api/facturas/detalle?factura_id=${facturaId}`);
      if (res.ok) {
        setDetalles(await res.json());
      }
    },
    []
  );

  const handleVerDetalles = async (factura: FacturaConRelaciones) => {
    setSelectedFactura(factura);
    try {
      await fetchDetalles(factura.id);
    } catch (error) {
      console.error('Error fetching detalles:', error);
    }
    setIsDetalleDialogOpen(true);
  };

  const handleAddDetalle = async () => {
    if (!selectedFactura) return;
    const base = parseFloat(detalleForm.monto || '0');
    const extra = parseFloat(detalleForm.extra || '0');
    const montoFinal = Number.isFinite(base + extra) ? base + extra : NaN;

    if (!detalleForm.descripcion && !detalleForm.tratamientoId) {
      toast.error('Seleccione un tratamiento o ingrese descripción');
      return;
    }

    if (!montoFinal || montoFinal <= 0) {
      toast.error('Monto debe ser mayor a 0');
      return;
    }

    const descripcion =
      detalleForm.descripcion ||
      tratamientos.find((t) => t.id.toString() === detalleForm.tratamientoId)?.nombre ||
      'Detalle';

    try {
      const res = await fetch('/api/facturas/detalle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factura_id: selectedFactura.id,
          descripcion,
          monto: parseFloat(montoFinal.toFixed(2)),
        }),
      });

      if (res.ok) {
        toast.success('Detalle agregado');
        setDetalleForm({ tratamientoId: '', descripcion: '', monto: '', extra: '' });
        await fetchDetalles(selectedFactura.id);
        await fetchFacturas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al agregar detalle');
      }
    } catch (error) {
      console.error('Error adding detalle:', error);
      toast.error('Error al agregar detalle');
    }
  };

  const handleDeleteDetalle = async (detalleId: number) => {
    if (!selectedFactura) return;
    try {
      const res = await fetch(`/api/facturas/detalle?id=${detalleId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Detalle eliminado');
        await fetchDetalles(selectedFactura.id);
        await fetchFacturas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'No se pudo eliminar');
      }
    } catch (error) {
      console.error('Error deleting detalle:', error);
      toast.error('Error al eliminar detalle');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setFormData(initialFormState);
    setNuevoDetalle({ ...initialNuevoDetalle });
    setDetallesNuevos([]);
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Pagado</Badge>;
      case 'Parcial':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'Anulado':
        return <Badge variant="outline">Anulado</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  // Stats
  const totalFacturado = facturas.reduce((acc, f) => acc + (f.monto_total || 0), 0);
  const totalCobrado = facturas
    .filter(f => f.estado_pago === 'Pagado')
    .reduce((acc, f) => acc + (f.monto_total || 0), 0);
  const totalPendiente = facturasPendientes.reduce((acc, f) => acc + (f.monto_total || 0), 0);

  return (
    <>
      <Header 
        title="Facturas" 
        subtitle="Gestión de facturación y pagos" 
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Facturado
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalFacturado.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{facturas.length} facturas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cobrado
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalCobrado.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Por Cobrar
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${totalPendiente.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{facturasPendientes.length} pendientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="todas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todas">Todas las Facturas</TabsTrigger>
            <TabsTrigger value="pendientes">
              Pendientes ({facturasPendientes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas">
            {/* Actions Bar */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar facturas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={filterEstado} onValueChange={setFilterEstado}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Pagado">Pagado</SelectItem>
                        <SelectItem value="Parcial">Parcial</SelectItem>
                        <SelectItem value="Anulado">Anulado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    if (!open) handleDialogClose();
                    else setIsDialogOpen(true);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Factura
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Nueva Factura</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Paciente *</Label>
                          <Select
                            value={formData.paciente_id?.toString() || ''}
                            onValueChange={(v) => setFormData({ ...formData, paciente_id: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar paciente" />
                            </SelectTrigger>
                            <SelectContent>
                              {pacientes.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.nombres} {p.apellidos}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Tratamiento</Label>
                            <Select
                              value={nuevoDetalle.tratamientoId}
                              onValueChange={(v) => {
                                const tratamiento = tratamientos.find((t) => t.id.toString() === v);
                                setNuevoDetalle({
                                  ...nuevoDetalle,
                                  tratamientoId: v,
                                  descripcion: tratamiento?.nombre || '',
                                  monto: tratamiento?.costo_base?.toString() || '',
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tratamiento" />
                              </SelectTrigger>
                              <SelectContent>
                                {tratamientos.map((t) => (
                                  <SelectItem key={t.id} value={t.id.toString()}>
                                    {t.nombre} ${t.costo_base?.toFixed(2)}
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">Otro / personalizado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Descripción</Label>
                            <Input
                              value={nuevoDetalle.descripcion}
                              onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, descripcion: e.target.value })}
                              placeholder="Ej. Limpieza + fluor"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Monto base ($)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={nuevoDetalle.monto}
                                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, monto: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Extras (+)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={nuevoDetalle.extra}
                                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, extra: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Total a facturar</Label>
                            <Input
                              readOnly
                              value={(
                                (parseFloat(nuevoDetalle.monto || '0') || 0) +
                                (parseFloat(nuevoDetalle.extra || '0') || 0)
                              ).toFixed(2)}
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">Añade este tratamiento a la lista</p>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                const total = calcDetalleTotal(nuevoDetalle);
                                if ((!nuevoDetalle.descripcion && !nuevoDetalle.tratamientoId) || total <= 0) {
                                  toast.error('Completa tratamiento/descripcion y monto > 0');
                                  return;
                                }
                                setDetallesNuevos([...detallesNuevos, { ...nuevoDetalle }]);
                                setNuevoDetalle({ ...initialNuevoDetalle });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar a factura
                            </Button>
                          </div>

                          {detallesNuevos.length > 0 && (
                            <div className="border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detallesNuevos.map((d, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{d.descripcion || tratamientos.find((t) => t.id.toString() === d.tratamientoId)?.nombre || 'Detalle'}</TableCell>
                                      <TableCell className="text-right">${calcDetalleTotal(d).toFixed(2)}</TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            setDetallesNuevos(detallesNuevos.filter((_, i) => i !== idx))
                                          }
                                        >
                                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow className="border-t-2">
                                    <TableCell className="font-bold">Total</TableCell>
                                    <TableCell className="text-right font-bold">
                                      ${detallesNuevos.reduce((acc, d) => acc + calcDetalleTotal(d), 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell />
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Estado de Pago</Label>
                            <Select
                              value={formData.estado_pago}
                              onValueChange={(v) => setFormData({ ...formData, estado_pago: v as 'Pendiente' | 'Pagado' | 'Parcial' | 'Anulado' })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Parcial">Parcial</SelectItem>
                                <SelectItem value="Pagado">Pagado</SelectItem>
                                <SelectItem value="Anulado">Anulado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={handleDialogClose}>
                            Cancelar
                          </Button>
                          <Button type="submit">Crear</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : filteredFacturas.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No se encontraron facturas
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. Factura</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFacturas.map((factura) => (
                            <TableRow key={factura.id}>
                              <TableCell className="font-medium">#{factura.id}</TableCell>
                              <TableCell>
                                {factura.pacientes?.nombres} {factura.pacientes?.apellidos}
                              </TableCell>
                              <TableCell>
                                {format(new Date(factura.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                ${factura.monto_total?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell>{estadoBadge(factura.estado_pago)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2 items-center">
                                  <Select
                                    value={factura.estado_pago}
                                    onValueChange={(v) => handleUpdateEstado(factura.id, v)}
                                  >
                                    <SelectTrigger className="w-36">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                                      <SelectItem value="Parcial">Parcial</SelectItem>
                                      <SelectItem value="Pagado">Pagado</SelectItem>
                                      <SelectItem value="Anulado">Anulado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleVerDetalles(factura)}
                                    title="Ver detalles"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden p-4 space-y-3">
                      {filteredFacturas.map((factura) => (
                        <div
                          key={factura.id}
                          className="rounded-lg border bg-muted/40 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Factura</p>
                              <p className="text-lg font-semibold">#{factura.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(factura.fecha_emision), 'dd/MM/yyyy', { locale: es })}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-sm font-semibold">
                                ${factura.monto_total?.toFixed(2) || '0.00'}
                              </p>
                              {estadoBadge(factura.estado_pago)}
                            </div>
                          </div>

                          <div className="text-sm">
                            <p className="font-medium">
                              {factura.pacientes?.nombres} {factura.pacientes?.apellidos}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {factura.citas?.motivo || 'Sin motivo'}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-end">
                            <Select
                              value={factura.estado_pago}
                              onValueChange={(v) => handleUpdateEstado(factura.id, v)}
                            >
                              <SelectTrigger className="w-full sm:w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pendiente">Pendiente</SelectItem>
                                <SelectItem value="Parcial">Parcial</SelectItem>
                                <SelectItem value="Pagado">Pagado</SelectItem>
                                <SelectItem value="Anulado">Anulado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleVerDetalles(factura)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalles
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendientes">
            <Card>
              <CardContent className="p-0">
                {facturasPendientes.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay facturas pendientes 🎉
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Días Pendiente</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facturasPendientes.map((factura) => (
                            <TableRow key={factura.factura_id}>
                              <TableCell className="font-medium">
                                {factura.paciente_nombre}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{factura.telefono}</p>
                                  <p className="text-muted-foreground">{factura.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={factura.dias_pendiente > 30 ? 'destructive' : 'secondary'}>
                                  {factura.dias_pendiente} días
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-amber-600">
                                ${factura.monto_total?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell>{estadoBadge(factura.estado_pago)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden p-4 space-y-3">
                      {facturasPendientes.map((factura) => (
                        <div
                          key={factura.factura_id}
                          className="rounded-lg border bg-muted/40 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{factura.paciente_nombre}</p>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>{factura.telefono}</p>
                                <p>{factura.email}</p>
                              </div>
                            </div>
                            <Badge variant={factura.dias_pendiente > 30 ? 'destructive' : 'secondary'}>
                              {factura.dias_pendiente} días
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Monto</p>
                            <p className="text-lg font-semibold text-amber-600">
                              ${factura.monto_total?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="flex justify-end">
                            {estadoBadge(factura.estado_pago)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detalle Dialog */}
        <Dialog open={isDetalleDialogOpen} onOpenChange={setIsDetalleDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Factura #{selectedFactura?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Paciente</p>
                  <p className="font-medium">
                    {selectedFactura?.pacientes?.nombres} {selectedFactura?.pacientes?.apellidos}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {selectedFactura && format(new Date(selectedFactura.fecha_emision), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Label>Estado de pago</Label>
                <Select
                  value={selectedFactura?.estado_pago || 'Pendiente'}
                  onValueChange={(v) => selectedFactura && handleUpdateEstado(selectedFactura.id, v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                    <SelectItem value="Pagado">Pagado</SelectItem>
                    <SelectItem value="Anulado">Anulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Sin detalles registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      detalles.map((detalle) => (
                        <TableRow key={detalle.id}>
                          <TableCell>{detalle.descripcion}</TableCell>
                          <TableCell className="text-right">${detalle.monto?.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDetalle(detalle.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">
                        ${selectedFactura?.monto_total?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <p className="text-sm font-medium">Agregar detalle</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tratamiento</Label>
                    <Select
                      value={detalleForm.tratamientoId}
                      onValueChange={(v) => {
                        const tratamiento = tratamientos.find((t) => t.id.toString() === v);
                        setDetalleForm({
                          ...detalleForm,
                          tratamientoId: v,
                          descripcion: tratamiento?.nombre || '',
                          monto: tratamiento?.costo_base?.toString() || '',
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tratamiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {tratamientos.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.nombre} ${t.costo_base?.toFixed(2)}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Otro / personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={detalleForm.descripcion}
                      onChange={(e) => setDetalleForm({ ...detalleForm, descripcion: e.target.value })}
                      placeholder="Ej. Limpieza + fluor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto base</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={detalleForm.monto}
                      onChange={(e) => setDetalleForm({ ...detalleForm, monto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Extras (+)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={detalleForm.extra}
                      onChange={(e) => setDetalleForm({ ...detalleForm, extra: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Total a agregar: $
                    {(
                      (parseFloat(detalleForm.monto || '0') || 0) +
                      (parseFloat(detalleForm.extra || '0') || 0)
                    ).toFixed(2)}
                  </p>
                  <Button onClick={handleAddDetalle}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

