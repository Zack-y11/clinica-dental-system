'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, User, Phone, Mail, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { Paciente, PacienteInsert } from '@/types/database';

const initialFormState: PacienteInsert = {
  nombres: '',
  apellidos: '',
  fecha_nacimiento: null,
  telefono: null,
  email: null,
  direccion: null,
  ultima_visita: null,
};

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PacienteInsert>(initialFormState);

  const fetchPacientes = useCallback(async () => {
    try {
      const res = await fetch('/api/pacientes');
      if (res.ok) {
        setPacientes(await res.json());
      }
    } catch (error) {
      console.error('Error fetching pacientes:', error);
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const filteredPacientes = pacientes.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      p.nombres.toLowerCase().includes(term) ||
      p.apellidos.toLowerCase().includes(term) ||
      p.telefono?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `/api/pacientes?id=${editingId}` 
        : '/api/pacientes';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Paciente actualizado' : 'Paciente creado');
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData(initialFormState);
        fetchPacientes();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving paciente:', error);
      toast.error('Error al guardar paciente');
    }
  };

  const handleEdit = (paciente: Paciente) => {
    setEditingId(paciente.id);
    setFormData({
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      fecha_nacimiento: paciente.fecha_nacimiento,
      telefono: paciente.telefono,
      email: paciente.email,
      direccion: paciente.direccion,
      ultima_visita: paciente.ultima_visita,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este paciente?')) return;

    try {
      const res = await fetch(`/api/pacientes?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Paciente eliminado');
        fetchPacientes();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting paciente:', error);
      toast.error('Error al eliminar paciente');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <>
      <Header 
        title="Pacientes" 
        subtitle="Gestión de pacientes de la clínica" 
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) handleDialogClose();
                else setIsDialogOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Paciente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? 'Editar Paciente' : 'Nuevo Paciente'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombres">Nombres *</Label>
                        <Input
                          id="nombres"
                          value={formData.nombres}
                          onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellidos">Apellidos *</Label>
                        <Input
                          id="apellidos"
                          value={formData.apellidos}
                          onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                      <Input
                        id="fecha_nacimiento"
                        type="date"
                        value={formData.fecha_nacimiento || ''}
                        onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value || null })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono || ''}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value || null })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Textarea
                        id="direccion"
                        value={formData.direccion || ''}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value || null })}
                        rows={2}
                      />
                    </div>

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
            ) : filteredPacientes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Última Visita</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPacientes.map((paciente) => (
                        <TableRow key={paciente.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="space-y-0.5">
                                <Link
                                  href={`/pacientes/${paciente.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {paciente.nombres} {paciente.apellidos}
                                </Link>
                                {paciente.fecha_nacimiento && (
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(paciente.fecha_nacimiento).toLocaleDateString('es')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {paciente.telefono && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {paciente.telefono}
                                </div>
                              )}
                              {paciente.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {paciente.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {paciente.ultima_visita ? (
                              <Badge variant="secondary">
                                {new Date(paciente.ultima_visita).toLocaleDateString('es')}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sin visitas</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                title="Ver ficha"
                              >
                                <Link href={`/pacientes/${paciente.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(paciente)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(paciente.id)}
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
                  {filteredPacientes.map((paciente) => (
                    <div
                      key={paciente.id}
                      className="rounded-lg border bg-muted/40 p-4 space-y-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <Link
                            href={`/pacientes/${paciente.id}`}
                            className="font-semibold leading-tight hover:underline"
                          >
                            {paciente.nombres} {paciente.apellidos}
                          </Link>
                          {paciente.fecha_nacimiento && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(paciente.fecha_nacimiento).toLocaleDateString('es')}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground space-y-1">
                            {paciente.telefono && <p>{paciente.telefono}</p>}
                            {paciente.email && <p>{paciente.email}</p>}
                          </div>
                        </div>
                      </div>

                      <div>
                        {paciente.ultima_visita ? (
                          <Badge variant="secondary">
                            Última visita: {new Date(paciente.ultima_visita).toLocaleDateString('es')}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sin visitas</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/pacientes/${paciente.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver ficha
                          </Link>
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(paciente)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(paciente.id)}
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

