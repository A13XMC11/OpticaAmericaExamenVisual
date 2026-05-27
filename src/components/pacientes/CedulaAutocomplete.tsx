"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Paciente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  _count?: { fichas: number };
}

async function buscar(q: string): Promise<Paciente[]> {
  const res = await fetch(`/api/pacientes/buscar?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

export function CedulaAutocomplete() {
  const [cedula, setCedula] = useState("");
  const debouncedCedula = useDebounce(cedula, 350);
  const router = useRouter();

  const { data: resultados = [], isLoading } = useQuery({
    queryKey: ["cedula-search", debouncedCedula],
    queryFn: () => buscar(debouncedCedula),
    enabled: debouncedCedula.length >= 3,
  });

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="space-y-1">
        <Label htmlFor="cedula-search">Buscar paciente por cédula</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="cedula-search"
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ingresa la cédula..."
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      {isLoading && debouncedCedula.length >= 3 && (
        <Skeleton className="h-16 w-full rounded-lg" />
      )}

      {!isLoading && debouncedCedula.length >= 3 && (
        <>
          {resultados.length > 0 ? (
            <div className="space-y-2">
              {resultados.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cédula: {p.cedula}
                        {p._count && ` · ${p._count.fichas} ficha(s)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/pacientes/${p.id}`)}
                    >
                      Ver perfil
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/fichas/nueva?pacienteId=${p.id}`)}
                    >
                      Nueva ficha
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-gray-700">
                  No se encontró paciente con cédula{" "}
                  <span className="font-mono font-medium">{debouncedCedula}</span>
                </p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  router.push(`/pacientes/nuevo?cedula=${encodeURIComponent(debouncedCedula)}`)
                }
              >
                Crear paciente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
