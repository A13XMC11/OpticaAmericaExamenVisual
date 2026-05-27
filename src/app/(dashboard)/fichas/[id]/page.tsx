import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findFichaById } from "@/modules/fichas/ficha.repository";
import { puedeGestionarPacientes, puedeCrearFicha } from "@/modules/auth/rbac";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  params: Promise<{ id: string }>;
}

type Medicion = {
  seccion: string;
  ojo: string;
  esfera?: string | null;
  cilindro?: string | null;
  eje?: string | null;
  adicion?: string | null;
  av?: string | null;
  avSinLentes?: string | null;
  avConLentes?: string | null;
  binocular?: string | null;
  dp?: string | null;
};

function MedicionTable({
  label,
  mediciones,
  seccion,
  cols,
}: {
  label: string;
  mediciones: Medicion[];
  seccion: string;
  cols: { key: keyof Medicion; label: string }[];
}) {
  const get = (ojo: string) => mediciones.find((m) => m.seccion === seccion && m.ojo === ojo);
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-10 border px-2 py-1" />
              {cols.map((c) => (
                <th key={c.key} className="border px-2 py-1 text-center font-medium text-gray-600">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(["OD", "OI"] as const).map((ojo) => {
              const m = get(ojo);
              return (
                <tr key={ojo}>
                  <td className="border bg-gray-50 px-2 py-1 text-center font-semibold text-gray-700">
                    {ojo}
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className="border px-2 py-1 text-center text-gray-800">
                      {(m?.[c.key] as string) ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function joinTruthy(items: (string | false | null | undefined)[]): string {
  return items.filter(Boolean).join(", ") || "—";
}

export default async function FichaDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !puedeGestionarPacientes(user)) redirect("/login");

  const ficha = await findFichaById(id);
  if (!ficha) notFound();

  const puedeEditar = puedeCrearFicha(user);

  const motivos = joinTruthy([
    ficha.motivoControl && "Control",
    ficha.motivoNoVeLejos && "No ve de lejos",
    ficha.motivoNoVeCerca && "No ve de cerca",
    ficha.motivoCefalea && "Cefalea",
    ficha.motivoHiperemia && "Hiperemia",
    ficha.motivoOtros,
  ]);

  const examExt = joinTruthy([
    ficha.hiperemia && "Hiperemia",
    ficha.resequedad && "Resequedad",
    ficha.secrecion && "Secreción",
    ficha.examenExternoOtros,
  ]);

  const antecedentes = joinTruthy([
    ficha.antDiabetes && "Diabetes",
    ficha.antHipertension && "Hipertensión",
    ficha.antGlaucoma && "Glaucoma",
    ficha.antCirugia && "Cirugía",
    ficha.lentesDesde != null && `Lentes desde ${ficha.lentesDesde}`,
    ficha.antecedentesOtros,
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ButtonLink href={`/pacientes/${ficha.pacienteId}`} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </ButtonLink>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {ficha.paciente
                ? `${ficha.paciente.nombre} ${ficha.paciente.apellido}`
                : "Ficha de examen"}
            </h1>
            <p className="text-sm text-gray-500">
              {format(ficha.fecha, "dd 'de' MMMM 'de' yyyy", { locale: es })}
              {ficha.paciente && ` · CC: ${ficha.paciente.cedula}`}
            </p>
          </div>
        </div>
        {puedeEditar && (
          <ButtonLink href={`/fichas/${id}/editar`} variant="outline" size="sm">
            <Pencil className="mr-1 h-4 w-4" />
            Editar
          </ButtonLink>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        {/* Meta info */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ficha.edadSnapshot != null && (
            <div>
              <p className="text-xs font-medium text-gray-500">Edad</p>
              <p className="text-sm">{ficha.edadSnapshot} años</p>
            </div>
          )}
          {ficha.ultimoExamenVisual && (
            <div>
              <p className="text-xs font-medium text-gray-500">Último examen</p>
              <p className="text-sm">{ficha.ultimoExamenVisual}</p>
            </div>
          )}
          {ficha.proximoControl && (
            <div>
              <p className="text-xs font-medium text-gray-500">Próximo control</p>
              <p className="text-sm font-semibold text-amber-600">
                {format(ficha.proximoControl, "dd/MM/yyyy")}
              </p>
            </div>
          )}
        </div>

        <Separator className="my-5" />

        {/* Motivo */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Motivo de consulta
          </p>
          <p className="text-sm text-gray-800">{motivos}</p>
        </div>

        <Separator className="my-5" />

        {/* Examen externo */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Examen Ocular Externo
          </p>
          {(ficha.pterigiumOD || ficha.pterigiumOI || ficha.pingueculaOD || ficha.pingueculaOI) && (
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {ficha.pterigiumOD && (
                <p>
                  <span className="text-xs text-gray-400">Pterigium OD:</span> {ficha.pterigiumOD}
                </p>
              )}
              {ficha.pterigiumOI && (
                <p>
                  <span className="text-xs text-gray-400">Pterigium OI:</span> {ficha.pterigiumOI}
                </p>
              )}
              {ficha.pingueculaOD && (
                <p>
                  <span className="text-xs text-gray-400">Pingüécula OD:</span>{" "}
                  {ficha.pingueculaOD}
                </p>
              )}
              {ficha.pingueculaOI && (
                <p>
                  <span className="text-xs text-gray-400">Pingüécula OI:</span>{" "}
                  {ficha.pingueculaOI}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-gray-800">{examExt}</p>
        </div>

        <Separator className="my-5" />

        {/* Antecedentes */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Antecedentes
          </p>
          <p className="text-sm text-gray-800">{antecedentes}</p>
        </div>

        <Separator className="my-5" />

        {/* Tablas de medición */}
        <div className="space-y-5">
          <MedicionTable
            label="Lentes en uso"
            mediciones={ficha.mediciones}
            seccion="LENTES_USO"
            cols={[
              { key: "esfera", label: "Esfera" },
              { key: "cilindro", label: "Cilindro" },
              { key: "eje", label: "Eje" },
              { key: "adicion", label: "Adición" },
              { key: "avSinLentes", label: "A.V. sin lentes" },
              { key: "avConLentes", label: "A.V. con lentes" },
            ]}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <MedicionTable
              label="Retinoscopia"
              mediciones={ficha.mediciones}
              seccion="RETINOSCOPIA"
              cols={[
                { key: "esfera", label: "Esfera" },
                { key: "cilindro", label: "Cilindro" },
                { key: "eje", label: "Eje" },
              ]}
            />
            <div className="space-y-3 text-sm">
              {ficha.oftalmoscopia && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Oftalmoscopia</p>
                  <p className="text-gray-800">{ficha.oftalmoscopia}</p>
                </div>
              )}
              {ficha.queratometria && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Queratometría</p>
                  <p className="text-gray-800">{ficha.queratometria}</p>
                </div>
              )}
            </div>
          </div>

          <MedicionTable
            label="Receta Final"
            mediciones={ficha.mediciones}
            seccion="RECETA_FINAL"
            cols={[
              { key: "esfera", label: "Esfera" },
              { key: "cilindro", label: "Cilindro" },
              { key: "eje", label: "Eje" },
              { key: "av", label: "A.V." },
              { key: "binocular", label: "Binocular" },
              { key: "adicion", label: "Adición" },
              { key: "dp", label: "D.P." },
            ]}
          />
        </div>

        {ficha.otros && (
          <>
            <Separator className="my-5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Otros / Observaciones
              </p>
              <p className="text-sm text-gray-800">{ficha.otros}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
