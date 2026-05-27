import { PacienteForm } from "@/components/pacientes/PacienteForm";
import { ButtonLink } from "@/components/ui/button-link";
import { ArrowLeft } from "lucide-react";

interface Props {
  searchParams: Promise<{ cedula?: string }>;
}

export default async function NuevoPacientePage({ searchParams }: Props) {
  const rawCedula = (await searchParams).cedula;
  const cedula =
    typeof rawCedula === "string" && /^\d{6,12}$/.test(rawCedula)
      ? rawCedula
      : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ButtonLink href="/pacientes" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
        </ButtonLink>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo paciente</h1>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <PacienteForm defaultValues={cedula ? { cedula } : undefined} />
      </div>
    </div>
  );
}
