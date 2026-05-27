"use client";

import { useForm, FormProvider, useFormContext, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fichaSchema, type FichaInput } from "@/modules/fichas/ficha.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PrescriptionTable } from "./PrescriptionTable";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

function FichaCheckBox({
  name,
  label,
}: {
  name: keyof FichaInput;
  label: string;
}) {
  const { watch, setValue } = useFormContext<FichaInput>();
  const checked = watch(name) as boolean;
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => setValue(name, !!v as never)}
      />
      {label}
    </label>
  );
}

interface FichaFormProps {
  pacienteId: string;
  realizadoById: string;
  fichaId?: string;
  defaultValues?: Partial<FichaInput>;
}

export function FichaForm({ pacienteId, realizadoById, fichaId, defaultValues }: FichaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<FichaInput>({
    resolver: zodResolver(fichaSchema) as Resolver<FichaInput>,
    defaultValues: {
      pacienteId,
      realizadoById,
      motivoControl: false,
      motivoNoVeLejos: false,
      motivoNoVeCerca: false,
      motivoCefalea: false,
      motivoHiperemia: false,
      hiperemia: false,
      resequedad: false,
      secrecion: false,
      antDiabetes: false,
      antHipertension: false,
      antGlaucoma: false,
      antCirugia: false,
      ...defaultValues,
    },
  });

  async function onSubmit(data: FichaInput) {
    setLoading(true);
    setError(null);
    try {
      const url = fichaId ? `/api/fichas/${fichaId}` : "/api/fichas";
      const method = fichaId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push(`/pacientes/${pacienteId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  const { register } = methods;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input type="date" {...register("fecha", { valueAsDate: true })} />
          </div>
          <div className="space-y-1">
            <Label>Edad</Label>
            <Input type="number" {...register("edadSnapshot", { valueAsNumber: true })} placeholder="Años" />
          </div>
          <div className="space-y-1">
            <Label>Último examen visual</Label>
            <Input {...register("ultimoExamenVisual")} placeholder="ej. 1 año en OA" />
          </div>
          <div className="space-y-1">
            <Label>Próximo control</Label>
            <Input type="date" {...register("proximoControl", { valueAsDate: true })} />
          </div>
        </div>

        <Separator />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Motivo de consulta</h3>
          <div className="flex flex-wrap gap-4">
            <FichaCheckBox name="motivoControl" label="Control" />
            <FichaCheckBox name="motivoNoVeLejos" label="No ve de lejos" />
            <FichaCheckBox name="motivoNoVeCerca" label="No ve de cerca" />
            <FichaCheckBox name="motivoCefalea" label="Cefalea" />
            <FichaCheckBox name="motivoHiperemia" label="Hiperemia" />
          </div>
          <div className="space-y-1">
            <Label>Otros</Label>
            <Input {...register("motivoOtros")} placeholder="Especificar..." />
          </div>
        </section>

        <Separator />

<section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Examen Ocular Externo</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Pterigium O.D.</Label>
              <Input {...register("pterigiumOD")} placeholder="-" />
            </div>
            <div className="space-y-1">
              <Label>Pterigium O.I.</Label>
              <Input {...register("pterigiumOI")} placeholder="-" />
            </div>
            <div className="space-y-1">
              <Label>Pingüécula O.D.</Label>
              <Input {...register("pingueculaOD")} placeholder="-" />
            </div>
            <div className="space-y-1">
              <Label>Pingüécula O.I.</Label>
              <Input {...register("pingueculaOI")} placeholder="-" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <FichaCheckBox name="hiperemia" label="Hiperemia" />
            <FichaCheckBox name="resequedad" label="Resequedad" />
            <FichaCheckBox name="secrecion" label="Secreción" />
          </div>
          <div className="space-y-1">
            <Label>Otros</Label>
            <Input {...register("examenExternoOtros")} placeholder="Especificar..." />
          </div>
        </section>

        <Separator />

<section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Antecedentes</h3>
          <div className="flex flex-wrap gap-4">
            <FichaCheckBox name="antDiabetes" label="Diabetes" />
            <FichaCheckBox name="antHipertension" label="Hipertensión" />
            <FichaCheckBox name="antGlaucoma" label="Glaucoma" />
            <FichaCheckBox name="antCirugia" label="Cirugía" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Lentes desde (año)</Label>
              <Input type="number" {...register("lentesDesde", { valueAsNumber: true })} placeholder="ej. 2005" />
            </div>
            <div className="space-y-1">
              <Label>Otros</Label>
              <Input {...register("antecedentesOtros")} placeholder="Especificar..." />
            </div>
          </div>
        </section>

        <Separator />

<section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Lentes en uso</h3>
          <PrescriptionTable seccion="lentesUso" />
        </section>

        <Separator />

<section className="space-y-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Retinoscopia</h3>
              <PrescriptionTable seccion="retinoscopia" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label>Oftalmoscopia</Label>
                <Input {...register("oftalmoscopia")} placeholder="-" />
              </div>
              <div className="space-y-1">
                <Label>Queratometría</Label>
                <Input {...register("queratometria")} placeholder="-" />
              </div>
            </div>
          </div>
        </section>

        <Separator />

<section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Receta Final</h3>
          <PrescriptionTable seccion="recetaFinal" />
        </section>

        <Separator />

        <div className="space-y-1">
          <Label>Otros / Observaciones</Label>
          <Input {...register("otros")} placeholder="Notas adicionales..." />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {fichaId ? "Guardar cambios" : "Crear ficha"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
