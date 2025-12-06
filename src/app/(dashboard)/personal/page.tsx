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
import { Plus, Pencil, Trash2, Search, UserCog, Stethoscope, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Personal, PersonalInsert } from '@/types/database';

const initialFormState: PersonalInsert = {
  nombre_completo: '',
  cargo: 'Odontologo',
  especialidad: null,
  no_licencia: null,
};

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCargo, setFilterCargo] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PersonalInsert>(initialFormState);

  const fetchPersonal = useCallback(async () => {
    try {
      const res = await fetch('/api/personal');
      if (res.ok) {
        setPersonal(await res.json());
      }
    } catch (error) {
      console.error('Error fetching personal:', error);
      toast.error('Error al cargar personal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

  const filteredPersonal = personal.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.nombre_completo.toLowerCase().includes(term);
    const matchesCargo = filterCargo === 'todos' || p.cargo === filterCargo;
    return matchesSearch && matchesCargo;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `/api/personal?id=${editingId}` 
        : '/api/personal';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Personal actualizado' : 'Personal creado');
        handleDialogClose();
        fetchPersonal();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving personal:', error);
      toast.error('Error al guardar personal');
    }
  };

  const handleEdit = (item: Personal) => {
    setEditingId(item.id);
    setFormData({
      nombre_completo: item.nombre_completo,
      cargo: item.cargo,
      especialidad: item.especialidad,
      no_licencia: item.no_licencia,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;

    try {
      const res = await fetch(`/api/personal?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Personal eliminado');
        fetchPersonal();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting personal:', error);
      toast.error('Error al eliminar personal');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const cargoBadge = (cargo: string) => {
    switch (cargo) {
      case 'Odontologo':
        return <Badge className="bg-primary"><Stethoscope className="h-3 w-3 mr-1" />Odontólogo</Badge>;
      case 'Asistente':
        return <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />Asistente</Badge>;
      default:
        return <Badge variant="outline"><UserCog className="h-3 w-3 mr-1" />Recepción</Badge>;
    }
  };

  // Stats
  const odontologos = personal.filter(p => p.cargo === 'Odontologo').length;
  const asistentes = personal.filter(p => p.cargo === 'Asistente').length;
  const recepcion = personal.filter(p => p.cargo === 'Recepcion').length;

  return (
    <>
      <Header 
        title="Personal" 
        subtitle="Gestión del equipo de la clínica" 
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Personal
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personal.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Odontólogos
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{odontologos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Asistentes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{asistentes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recepción
              </CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recepcion}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar personal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterCargo} onValueChange={setFilterCargo}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Odontologo">Odontólogo</SelectItem>
                    <SelectItem value="Asistente">Asistente</SelectItem>
                    <SelectItem value="Recepcion">Recepción</SelectItem>
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
                    Nuevo Personal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? 'Editar Personal' : 'Nuevo Personal'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                      <Input
                        id="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                        required
                        placeholder="Dr. Juan Pérez"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cargo *</Label>
                      <Select
                        value={formData.cargo}
                        onValueChange={(v) => setFormData({ ...formData, cargo: v as 'Odontologo' | 'Asistente' | 'Recepcion' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Odontologo">Odontólogo</SelectItem>
                          <SelectItem value="Asistente">Asistente</SelectItem>
                          <SelectItem value="Recepcion">Recepción</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.cargo === 'Odontologo' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="especialidad">Especialidad</Label>
                          <Input
                            id="especialidad"
                            value={formData.especialidad || ''}
                            onChange={(e) => setFormData({ ...formData, especialidad: e.target.value || null })}
                            placeholder="Ej: Ortodoncia"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="no_licencia">No. de Licencia</Label>
                          <Input
                            id="no_licencia"
                            value={formData.no_licencia || ''}
                            onChange={(e) => setFormData({ ...formData, no_licencia: e.target.value || null })}
                            placeholder="Ej: JVPM-12345"
                          />
                        </div>
                      </>
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
            ) : filteredPersonal.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm || filterCargo !== 'todos' ? 'No se encontró personal' : 'No hay personal registrado'}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Especialidad</TableHead>
                        <TableHead>No. Licencia</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPersonal.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {item.cargo === 'Odontologo' ? (
                                  <Stethoscope className="h-5 w-5 text-primary" />
                                ) : (
                                  <UserCog className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-medium">{item.nombre_completo}</span>
                            </div>
                          </TableCell>
                          <TableCell>{cargoBadge(item.cargo)}</TableCell>
                          <TableCell>
                            {item.especialidad || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {item.no_licencia || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
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

                <div className="md:hidden p-4 space-y-3">
                  {filteredPersonal.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border bg-muted/40 p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {item.cargo === 'Odontologo' ? (
                              <Stethoscope className="h-5 w-5 text-primary" />
                            ) : (
                              <UserCog className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold leading-tight">{item.nombre_completo}</p>
                            <p className="text-xs text-muted-foreground">{item.cargo}</p>
                          </div>
                        </div>
                        {cargoBadge(item.cargo)}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Especialidad: {item.especialidad || '—'}</p>
                        <p>Licencia: {item.no_licencia || '—'}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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
    </>
  );
}

