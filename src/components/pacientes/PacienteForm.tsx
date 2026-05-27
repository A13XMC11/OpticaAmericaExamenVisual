"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pacienteSchema, type PacienteInput } from "@/modules/pacientes/paciente.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagSelector } from "./TagSelector";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PacienteFormProps {
  pacienteId?: string;
  defaultValues?: Partial<PacienteInput>;
}

export function PacienteForm({ pacienteId, defaultValues }: PacienteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PacienteInput>({
    resolver: zodResolver(pacienteSchema) as Resolver<PacienteInput>,
    defaultValues: { tagIds: [], ...defaultValues },
  });

  const tagIds = watch("tagIds") ?? [];

  async function onSubmit(data: PacienteInput) {
    setLoading(true);
    setError(null);
    try {
      const url = pacienteId ? `/api/pacientes/${pacienteId}` : "/api/pacientes";
      const method = pacienteId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push(`/pacientes/${json.data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  function field(key: keyof PacienteInput) {
    return errors[key]?.message as string | undefined;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cedula">Cédula *</Label>
          <Input id="cedula" {...register("cedula")} placeholder="0000000000" />
          {field("cedula") && <p className="text-xs text-red-500">{field("cedula")}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" {...register("nombre")} placeholder="Nombre" />
          {field("nombre") && <p className="text-xs text-red-500">{field("nombre")}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" {...register("apellido")} placeholder="Apellido" />
          {field("apellido") && <p className="text-xs text-red-500">{field("apellido")}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fechaNacimiento">Fecha de nacimiento *</Label>
          <Input id="fechaNacimiento" type="date" {...register("fechaNacimiento", { valueAsDate: true })} />
          {field("fechaNacimiento") && <p className="text-xs text-red-500">{field("fechaNacimiento")}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...register("telefono")} placeholder="0987654321" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="correo@email.com" />
          {field("email") && <p className="text-xs text-red-500">{field("email")}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ocupacion">Ocupación</Label>
          <Input id="ocupacion" {...register("ocupacion")} placeholder="Abogado, Estudiante..." />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Input id="direccion" {...register("direccion")} placeholder="Calle y número" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Etiquetas</Label>
        <TagSelector
          selectedIds={tagIds}
          onChange={(ids) => setValue("tagIds", ids)}
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {pacienteId ? "Guardar cambios" : "Crear paciente"}
        </Button>
      </div>
    </form>
  );
}
