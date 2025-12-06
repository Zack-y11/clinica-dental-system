'use client';

import { useEffect, useState } from 'react';
import { Bell, EllipsisVertical, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface NotiCita {
  cita_id: number;
  fecha_hora: string;
  motivo: string | null;
  paciente_nombre: string;
  doctor_nombre: string;
  estado: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [notiCitas, setNotiCitas] = useState<NotiCita[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/views/citas-hoy?range=day');
        if (!res.ok) return;
        const data = await res.json();
        const pendientes = (data as NotiCita[]).filter((c) => c.estado !== 'Completada');
        setNotiCitas(pendientes);
      } catch (e) {
        console.error('Error cargando notificaciones', e);
      }
    };
    load();
  }, []);

  const count = notiCitas.length;
  const badge = count > 0 && (
    <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 bg-destructive rounded-full text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
      {count}
    </span>
  );

  const listado = notiCitas.slice(0, 5);

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 min-h-16 px-4 pl-16 md:px-6 md:pl-6 md:flex-nowrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full justify-end md:w-auto">
          {/* Search (desktop/tablet) */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-64 pl-9 bg-muted/50"
            />
          </div>

          {/* Notifications (desktop/tablet) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hidden md:inline-flex" aria-label="Notificaciones de citas de hoy">
                <Bell className="h-5 w-5" />
                {badge}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  Notificaciones
                </p>
                {count === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin citas pendientes hoy.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {listado.map((cita) => (
                      <li key={cita.cita_id} className="rounded border p-2">
                        <div className="flex justify-between">
                          <span className="font-medium truncate">{cita.paciente_nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(cita.fecha_hora).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {cita.motivo || 'Sin motivo'} • {cita.doctor_nombre || 'Sin doctor'}
                        </p>
                        <p className="text-xs text-amber-700">Estado: {cita.estado}</p>
                      </li>
                    ))}
                    {count > listado.length && (
                      <li className="text-xs text-muted-foreground">+{count - listado.length} más...</li>
                    )}
                  </ul>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Compact actions (mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir acciones">
                <EllipsisVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem className="gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
                <span className="ml-auto h-4 min-w-[1.25rem] px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] font-semibold flex items-center justify-center">
                  {count}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 pb-1 pt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-9 bg-muted/50"
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

