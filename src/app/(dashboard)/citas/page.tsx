'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CalendarIcon, 
  Clock, 
  User,
  Check,
  X as XIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Paciente, Personal, CitaInsert } from '@/types/database';

interface CitaConRelaciones {
  id: number;
  paciente_id: number;
  doctor_id: number | null;
  fecha_hora: string;
  motivo: string | null;
  estado: string;
  pacientes: { id: number; nombres: string; apellidos: string; telefono: string | null } | null;
  personal: { id: number; nombre_completo: string; especialidad: string | null } | null;
}

const initialFormState: CitaInsert = {
  paciente_id: 0,
  doctor_id: null,
  fecha_hora: '',
  motivo: null,
  estado: 'Programada',
};

export default function CitasPage() {
  const [citas, setCitas] = useState<CitaConRelaciones[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctores, setDoctores] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CitaInsert>(initialFormState);
  const [formDate, setFormDate] = useState<Date | undefined>();
  const [formTime, setFormTime] = useState('09:00');

  const fetchCitas = useCallback(async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/citas?fecha=${dateStr}`);
      if (res.ok) {
        setCitas(await res.json());
      }
    } catch (error) {
      console.error('Error fetching citas:', error);
      toast.error('Error al cargar citas');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchPacientesYDoctores = useCallback(async () => {
    try {
      const [pacientesRes, doctoresRes] = await Promise.all([
        fetch('/api/pacientes'),
        fetch('/api/personal?cargo=Odontologo')
      ]);
      if (pacientesRes.ok) setPacientes(await pacientesRes.json());
      if (doctoresRes.ok) setDoctores(await doctoresRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    fetchCitas();
    fetchPacientesYDoctores();
  }, [fetchCitas, fetchPacientesYDoctores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDate || !formData.paciente_id || !formData.doctor_id) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const fechaHora = `${format(formDate, 'yyyy-MM-dd')}T${formTime}:00`;
    const dataToSend = { ...formData, fecha_hora: fechaHora };

    try {
      const url = editingId 
        ? `/api/citas?id=${editingId}` 
        : '/api/citas';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        toast.success(editingId ? 'Cita actualizada' : 'Cita creada');
        handleDialogClose();
        fetchCitas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving cita:', error);
      toast.error('Error al guardar cita');
    }
  };

  const handleEdit = (cita: CitaConRelaciones) => {
    const citaDate = new Date(cita.fecha_hora);
    setEditingId(cita.id);
    setFormData({
      paciente_id: cita.paciente_id,
      doctor_id: cita.doctor_id,
      fecha_hora: cita.fecha_hora,
      motivo: cita.motivo,
      estado: cita.estado as 'Programada' | 'Completada' | 'Cancelada',
    });
    setFormDate(citaDate);
    setFormTime(format(citaDate, 'HH:mm'));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta cita?')) return;

    try {
      const res = await fetch(`/api/citas?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Cita eliminada');
        fetchCitas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting cita:', error);
      toast.error('Error al eliminar cita');
    }
  };

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/citas?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        toast.success(`Cita ${nuevoEstado.toLowerCase()}`);
        fetchCitas();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error updating cita:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
    setFormDate(undefined);
    setFormTime('09:00');
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'Completada':
        return <Badge className="bg-green-500">Completada</Badge>;
      case 'Cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">Programada</Badge>;
    }
  };

  return (
    <>
      <Header 
        title="Citas" 
        subtitle="Gestión de citas y agenda" 
      />

      <div className="p-6 space-y-6">
        {/* Calendar & Actions */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Calendar Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Seleccionar Fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={es}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Citas del día */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Citas del {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) handleDialogClose();
                else setIsDialogOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Cita
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? 'Editar Cita' : 'Nueva Cita'}
                    </DialogTitle>
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

                    <div className="space-y-2">
                      <Label>Doctor *</Label>
                      <Select
                        value={formData.doctor_id?.toString() || ''}
                        onValueChange={(v) => setFormData({ ...formData, doctor_id: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctores.map((d) => (
                            <SelectItem key={d.id} value={d.id.toString()}>
                              {d.nombre_completo} - {d.especialidad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !formDate && 'text-muted-foreground'
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formDate ? format(formDate, 'dd/MM/yyyy') : 'Seleccionar'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formDate}
                              onSelect={setFormDate}
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Hora *</Label>
                        <Input
                          type="time"
                          value={formTime}
                          onChange={(e) => setFormTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Motivo</Label>
                      <Textarea
                        value={formData.motivo || ''}
                        onChange={(e) => setFormData({ ...formData, motivo: e.target.value || null })}
                        rows={2}
                        placeholder="Motivo de la consulta..."
                      />
                    </div>

                    {editingId && (
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select
                          value={formData.estado}
                          onValueChange={(v) => setFormData({ ...formData, estado: v as 'Programada' | 'Completada' | 'Cancelada' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Programada">Programada</SelectItem>
                            <SelectItem value="Completada">Completada</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingId ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : citas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No hay citas para este día
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {citas.map((cita) => (
                          <TableRow key={cita.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(cita.fecha_hora), 'HH:mm')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {cita.pacientes?.nombres} {cita.pacientes?.apellidos}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {cita.pacientes?.telefono}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{cita.personal?.nombre_completo}</p>
                              <p className="text-xs text-muted-foreground">
                                {cita.personal?.especialidad}
                              </p>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {cita.motivo || '-'}
                            </TableCell>
                            <TableCell>{estadoBadge(cita.estado)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {cita.estado === 'Programada' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUpdateEstado(cita.id, 'Completada')}
                                      title="Marcar como completada"
                                    >
                                      <Check className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleUpdateEstado(cita.id, 'Cancelada')}
                                      title="Cancelar cita"
                                    >
                                      <XIcon className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(cita)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(cita.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                    {citas.map((cita) => (
                      <div
                        key={cita.id}
                        className="rounded-lg border bg-muted/40 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(cita.fecha_hora), 'HH:mm')}
                          </div>
                          {estadoBadge(cita.estado)}
                        </div>

                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight truncate">
                              {cita.pacientes?.nombres} {cita.pacientes?.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {cita.pacientes?.telefono || 'Sin teléfono'}
                            </p>
                          </div>
                        </div>

                        <div className="text-sm">
                          <p className="font-medium">{cita.personal?.nombre_completo}</p>
                          <p className="text-muted-foreground text-xs">
                            {cita.personal?.especialidad || '—'}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {cita.motivo || 'Sin motivo registrado'}
                        </p>

                        <div className="flex flex-wrap gap-2 justify-end">
                          {cita.estado === 'Programada' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateEstado(cita.id, 'Completada')}
                              >
                                <Check className="h-4 w-4 mr-1 text-green-600" />
                                Completar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateEstado(cita.id, 'Cancelada')}
                              >
                                <XIcon className="h-4 w-4 mr-1 text-red-500" />
                                Cancelar
                              </Button>
                            </>
                          )}
                          <Button variant="secondary" size="sm" onClick={() => handleEdit(cita)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(cita.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

