import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findPacienteById } from "@/modules/pacientes/paciente.repository";
import { puedeGestionarPacientes } from "@/modules/auth/rbac";
import { PacienteForm } from "@/components/pacientes/PacienteForm";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "lucide-react";
import type { PacienteInput } from "@/modules/pacientes/paciente.schema";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarPacientePage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !puedeGestionarPacientes(user)) redirect("/login");

  const paciente = await findPacienteById(id);
  if (!paciente) notFound();

  const defaultValues: Partial<PacienteInput> = {
    cedula: paciente.cedula,
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    fechaNacimiento: new Date(paciente.fechaNacimiento).toISOString().split("T")[0] as unknown as Date,
    telefono: paciente.telefono ?? "",
    email: paciente.email ?? "",
    ocupacion: paciente.ocupacion ?? "",
    direccion: paciente.direccion ?? "",
    tagIds: paciente.tags.map(({ tag }) => tag.id),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ButtonLink href={`/pacientes/${id}`} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </ButtonLink>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar paciente</h1>
          <p className="text-sm text-gray-500">
            {paciente.nombre} {paciente.apellido} — CC: {paciente.cedula}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <PacienteForm pacienteId={id} defaultValues={defaultValues} />
      </div>
    </div>
  );
}
