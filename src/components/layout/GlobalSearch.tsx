"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

interface Paciente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
}

async function buscarPacientes(q: string): Promise<Paciente[]> {
  if (q.length < 2) return [];
  const res = await fetch(`/api/pacientes/buscar?q=${encodeURIComponent(q)}`);
  const json = await res.json();
  return json.data ?? [];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: resultados = [] } = useQuery({
    queryKey: ["buscar-pacientes", debouncedQuery],
    queryFn: () => buscarPacientes(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  function handleSelect(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/pacientes/${id}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar paciente...</span>
        <kbd className="hidden rounded bg-gray-200 px-1.5 text-xs sm:inline">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar por cédula, nombre o apellido..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {query.length < 2 ? "Escribe al menos 2 caracteres..." : "Sin resultados"}
          </CommandEmpty>
          {resultados.length > 0 && (
            <CommandGroup heading="Pacientes">
              {resultados.map((p) => (
                <CommandItem key={p.id} onSelect={() => handleSelect(p.id)}>
                  <div className="flex flex-col">
                    <span className="font-medium">{p.nombre} {p.apellido}</span>
                    <span className="text-xs text-gray-500">Cédula: {p.cedula}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
