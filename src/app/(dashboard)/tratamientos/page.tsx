'use client';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Stethoscope, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { CatalogoTratamiento, CatalogoTratamientoInsert } from '@/types/database';

const initialFormState: CatalogoTratamientoInsert = {
  nombre: '',
  descripcion: null,
  costo_base: null,
};

export default function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState<CatalogoTratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CatalogoTratamientoInsert>(initialFormState);

  const fetchTratamientos = useCallback(async () => {
    try {
      const res = await fetch('/api/tratamientos/catalogo');
      if (res.ok) {
        setTratamientos(await res.json());
      }
    } catch (error) {
      console.error('Error fetching tratamientos:', error);
      toast.error('Error al cargar tratamientos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTratamientos();
  }, [fetchTratamientos]);

  const filteredTratamientos = tratamientos.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.nombre.toLowerCase().includes(term) ||
      t.descripcion?.toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId 
        ? `/api/tratamientos/catalogo?id=${editingId}` 
        : '/api/tratamientos/catalogo';
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingId ? 'Tratamiento actualizado' : 'Tratamiento creado');
        handleDialogClose();
        fetchTratamientos();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving tratamiento:', error);
      toast.error('Error al guardar tratamiento');
    }
  };

  const handleEdit = (tratamiento: CatalogoTratamiento) => {
    setEditingId(tratamiento.id);
    setFormData({
      nombre: tratamiento.nombre,
      descripcion: tratamiento.descripcion,
      costo_base: tratamiento.costo_base,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este tratamiento?')) return;

    try {
      const res = await fetch(`/api/tratamientos/catalogo?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Tratamiento eliminado');
        fetchTratamientos();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting tratamiento:', error);
      toast.error('Error al eliminar tratamiento');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  // Stats
  const totalTratamientos = tratamientos.length;
  const precioPromedio = tratamientos.length > 0
    ? tratamientos.reduce((acc, t) => acc + (t.costo_base || 0), 0) / tratamientos.length
    : 0;
  const precioMax = Math.max(...tratamientos.map(t => t.costo_base || 0), 0);

  return (
    <>
      <Header 
        title="Catálogo de Tratamientos" 
        subtitle="Gestión de servicios y precios" 
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tratamientos
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTratamientos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Precio Promedio
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${precioPromedio.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Precio Máximo
              </CardTitle>
              <DollarSign className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${precioMax.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tratamientos..."
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
                    Nuevo Tratamiento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                        placeholder="Ej: Limpieza Dental"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion || ''}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value || null })}
                        rows={3}
                        placeholder="Descripción del tratamiento..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="costo_base">Costo Base ($)</Label>
                      <Input
                        id="costo_base"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.costo_base || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          costo_base: e.target.value ? parseFloat(e.target.value) : null 
                        })}
                        placeholder="0.00"
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
            ) : filteredTratamientos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? 'No se encontraron tratamientos' : 'No hay tratamientos registrados'}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tratamiento</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Costo Base</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTratamientos.map((tratamiento) => (
                        <TableRow key={tratamiento.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-medium">{tratamiento.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm text-muted-foreground truncate">
                              {tratamiento.descripcion || 'Sin descripción'}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {tratamiento.costo_base ? (
                              <Badge variant="secondary" className="font-mono">
                                ${tratamiento.costo_base.toFixed(2)}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Sin precio</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(tratamiento)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(tratamiento.id)}
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
                  {filteredTratamientos.map((tratamiento) => (
                    <div
                      key={tratamiento.id}
                      className="rounded-lg border bg-muted/40 p-4 space-y-3 w-full"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold leading-tight break-words">{tratamiento.nombre}</p>
                          <p className="text-xs text-muted-foreground break-words">
                            {tratamiento.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Costo base</span>
                        {tratamiento.costo_base ? (
                          <span className="text-lg font-semibold text-green-700 whitespace-nowrap">
                            ${tratamiento.costo_base.toFixed(2)}
                          </span>
                        ) : (
                          <Badge variant="outline">Sin precio</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(tratamiento)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(tratamiento.id)}
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

