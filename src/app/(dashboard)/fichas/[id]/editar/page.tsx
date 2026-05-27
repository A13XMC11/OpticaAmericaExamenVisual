import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findFichaById } from "@/modules/fichas/ficha.repository";
import { puedeCrearFicha } from "@/modules/auth/rbac";
import { FichaForm } from "@/components/fichas/FichaForm";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "lucide-react";
import type { FichaInput } from "@/modules/fichas/ficha.schema";

interface Props {
  params: Promise<{ id: string }>;
}

const fmt = (d: Date) => d.toISOString().split("T")[0];

export default async function EditarFichaPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !puedeCrearFicha(user)) redirect("/pacientes");

  const ficha = await findFichaById(id);
  if (!ficha) notFound();

  function getMedicion(seccion: string, ojo: string) {
    return ficha!.mediciones.find((m) => m.seccion === seccion && m.ojo === ojo);
  }

  function toMedicionInput(m: ReturnType<typeof getMedicion>) {
    if (!m) return undefined;
    return {
      esfera: m.esfera ?? "",
      cilindro: m.cilindro ?? "",
      eje: m.eje ?? "",
      adicion: m.adicion ?? "",
      av: m.av ?? "",
      avSinLentes: m.avSinLentes ?? "",
      avConLentes: m.avConLentes ?? "",
      binocular: m.binocular ?? "",
      dp: m.dp ?? "",
    };
  }

  const defaultValues: Partial<FichaInput> = {
    fecha: fmt(ficha.fecha) as unknown as Date,
    edadSnapshot: ficha.edadSnapshot ?? undefined,
    ultimoExamenVisual: ficha.ultimoExamenVisual ?? "",
    proximoControl: ficha.proximoControl
      ? (fmt(ficha.proximoControl) as unknown as Date)
      : undefined,
    motivoControl: ficha.motivoControl,
    motivoNoVeLejos: ficha.motivoNoVeLejos,
    motivoNoVeCerca: ficha.motivoNoVeCerca,
    motivoCefalea: ficha.motivoCefalea,
    motivoHiperemia: ficha.motivoHiperemia,
    motivoOtros: ficha.motivoOtros ?? "",
    pterigiumOD: ficha.pterigiumOD ?? "",
    pterigiumOI: ficha.pterigiumOI ?? "",
    pingueculaOD: ficha.pingueculaOD ?? "",
    pingueculaOI: ficha.pingueculaOI ?? "",
    hiperemia: ficha.hiperemia,
    resequedad: ficha.resequedad,
    secrecion: ficha.secrecion,
    examenExternoOtros: ficha.examenExternoOtros ?? "",
    antDiabetes: ficha.antDiabetes,
    antHipertension: ficha.antHipertension,
    antGlaucoma: ficha.antGlaucoma,
    antCirugia: ficha.antCirugia,
    lentesDesde: ficha.lentesDesde ?? undefined,
    antecedentesOtros: ficha.antecedentesOtros ?? "",
    oftalmoscopia: ficha.oftalmoscopia ?? "",
    queratometria: ficha.queratometria ?? "",
    otros: ficha.otros ?? "",
    lentesUsoOD: toMedicionInput(getMedicion("LENTES_USO", "OD")),
    lentesUsoOI: toMedicionInput(getMedicion("LENTES_USO", "OI")),
    retinoscopiaOD: toMedicionInput(getMedicion("RETINOSCOPIA", "OD")),
    retinoscopiaOI: toMedicionInput(getMedicion("RETINOSCOPIA", "OI")),
    recetaFinalOD: toMedicionInput(getMedicion("RECETA_FINAL", "OD")),
    recetaFinalOI: toMedicionInput(getMedicion("RECETA_FINAL", "OI")),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <ButtonLink href={`/fichas/${id}`} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </ButtonLink>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar ficha de examen</h1>
          {ficha.paciente && (
            <p className="text-sm text-gray-500">
              {ficha.paciente.nombre} {ficha.paciente.apellido} — CC: {ficha.paciente.cedula}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <FichaForm
          pacienteId={ficha.pacienteId}
          realizadoById={ficha.realizadoById}
          fichaId={id}
          defaultValues={defaultValues}
        />
      </div>
    </div>
  );
}
