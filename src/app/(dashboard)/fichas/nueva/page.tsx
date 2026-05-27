import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findPacienteById } from "@/modules/pacientes/paciente.repository";
import { puedeCrearFicha } from "@/modules/auth/rbac";
import { FichaForm } from "@/components/fichas/FichaForm";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "lucide-react";

interface Props {
  searchParams: Promise<{ pacienteId?: string }>;
}

export default async function NuevaFichaPage({ searchParams }: Props) {
  const { pacienteId } = await searchParams;
  if (!pacienteId) redirect("/pacientes");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !puedeCrearFicha(user)) redirect("/pacientes");

  const paciente = await findPacienteById(pacienteId);
  if (!paciente) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <ButtonLink href={`/pacientes/${pacienteId}`} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </ButtonLink>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva ficha de examen</h1>
          <p className="text-sm text-gray-500">
            {paciente.nombre} {paciente.apellido} — CC: {paciente.cedula}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <FichaForm
          pacienteId={pacienteId}
          realizadoById={user.id}
          defaultValues={{
            edadSnapshot: calcularEdad(paciente.fechaNacimiento),
            ultimoExamenVisual: ultimoExamenVisual(paciente.fichas),
          }}
        />
      </div>
    </div>
  );
}

function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function ultimoExamenVisual(fichas: { fecha: string }[]): string {
  const ref = fichas[0]?.fecha ? new Date(fichas[0].fecha) : new Date();
  return ref.toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
}
