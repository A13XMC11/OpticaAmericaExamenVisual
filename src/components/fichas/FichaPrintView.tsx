"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Medicion {
  seccion: string;
  ojo: string;
  esfera?: string;
  cilindro?: string;
  eje?: string;
  adicion?: string;
  av?: string;
  avSinLentes?: string;
  avConLentes?: string;
  binocular?: string;
  dp?: string;
}

interface FichaDetalle {
  id: string;
  fecha: string;
  edadSnapshot?: number | null;
  ultimoExamenVisual?: string | null;
  realizadoById: string;
  motivoControl: boolean;
  motivoNoVeLejos: boolean;
  motivoNoVeCerca: boolean;
  motivoCefalea: boolean;
  motivoHiperemia: boolean;
  motivoOtros?: string | null;
  pterigiumOD?: string | null;
  pterigiumOI?: string | null;
  pingueculaOD?: string | null;
  pingueculaOI?: string | null;
  hiperemia: boolean;
  resequedad: boolean;
  secrecion: boolean;
  examenExternoOtros?: string | null;
  antDiabetes: boolean;
  antHipertension: boolean;
  antGlaucoma: boolean;
  antCirugia: boolean;
  lentesDesde?: number | null;
  antecedentesOtros?: string | null;
  oftalmoscopia?: string | null;
  queratometria?: string | null;
  otros?: string | null;
  proximoControl?: string | null;
  mediciones: Medicion[];
  paciente: { nombre: string; apellido: string; cedula: string; telefono?: string | null; direccion?: string | null; ocupacion?: string | null };
}

function getMedicion(mediciones: Medicion[], seccion: string, ojo: string) {
  return mediciones.find((m) => m.seccion === seccion && m.ojo === ojo);
}

function PrintTable({ label, mediciones, seccion, cols }: {
  label: string;
  mediciones: Medicion[];
  seccion: string;
  cols: { key: keyof Medicion; label: string }[];
}) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-xs font-semibold uppercase text-gray-600">{label}</p>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-1 py-0.5 text-left w-8" />
            {cols.map((c) => (
              <th key={c.key} className="border border-gray-300 px-1 py-0.5 text-center">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["OD", "OI"].map((ojo) => {
            const m = getMedicion(mediciones, seccion, ojo);
            return (
              <tr key={ojo}>
                <td className="border border-gray-300 px-1 py-0.5 text-center font-semibold">{ojo}</td>
                {cols.map((c) => (
                  <td key={c.key} className="border border-gray-300 px-1 py-0.5 text-center">
                    {(m?.[c.key] as string) ?? ""}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface FichaPrintViewProps {
  fichaId: string;
  data?: FichaDetalle;
}

export function FichaPrintView({ fichaId, data: initialData }: FichaPrintViewProps) {
  const [data, setData] = useState<FichaDetalle | null>(initialData ?? null);

  useEffect(() => {
    if (initialData || !fichaId) return;
    fetch(`/api/fichas/${fichaId}`)
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, [fichaId, initialData]);

  if (!data) return <div className="p-4 text-xs text-gray-400">Cargando...</div>;

  const boolList = (items: { label: string; val: boolean }[]) =>
    items.filter((i) => i.val).map((i) => i.label).join(", ") || "—";

  return (
    <div className="print-page bg-white p-6 text-xs" style={{ width: "210mm", minHeight: "297mm" }}>
      {/* Encabezado */}
      <div className="mb-4 flex items-start justify-between border-b pb-3">
        <div>
          <span className="text-xl font-bold text-blue-700">óptica</span>
          <span className="text-xl font-bold text-gray-800">américa</span>
          <p className="text-[10px] text-gray-400">desde 1982</p>
        </div>
        <div className="text-right text-[10px] text-gray-600 space-y-0.5">
          <p>Fecha: {format(new Date(data.fecha), "dd/MM/yyyy", { locale: es })}</p>
          <p>Dirección: {data.paciente.direccion ?? ""}</p>
          <p>Teléfono: {data.paciente.telefono ?? ""}</p>
        </div>
      </div>

      {/* Datos del paciente */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-[10px]">
        <p><span className="font-semibold">Paciente:</span> {data.paciente.nombre} {data.paciente.apellido}</p>
        <p><span className="font-semibold">Cédula:</span> {data.paciente.cedula}</p>
        <p><span className="font-semibold">Edad:</span> {data.edadSnapshot ?? ""}</p>
        <p><span className="font-semibold">Ocupación:</span> {data.paciente.ocupacion ?? ""}</p>
        <p><span className="font-semibold">Último examen:</span> {data.ultimoExamenVisual ?? ""}</p>
      </div>

      {/* Motivo */}
      <div className="mb-3 text-[10px]">
        <span className="font-semibold">Motivo de consulta: </span>
        {boolList([
          { label: "Control", val: data.motivoControl },
          { label: "No ve de lejos", val: data.motivoNoVeLejos },
          { label: "No ve de cerca", val: data.motivoNoVeCerca },
          { label: "Cefalea", val: data.motivoCefalea },
          { label: "Hiperemia", val: data.motivoHiperemia },
        ])}
        {data.motivoOtros && `, ${data.motivoOtros}`}
      </div>

      {/* Examen externo */}
      <div className="mb-3 text-[10px]">
        <p className="font-semibold mb-0.5">Examen Ocular Externo:</p>
        <div className="grid grid-cols-2 gap-1">
          {data.pterigiumOD && <p>Pterigium OD: {data.pterigiumOD}</p>}
          {data.pterigiumOI && <p>Pterigium OI: {data.pterigiumOI}</p>}
          {data.pingueculaOD && <p>Pingüécula OD: {data.pingueculaOD}</p>}
          {data.pingueculaOI && <p>Pingüécula OI: {data.pingueculaOI}</p>}
        </div>
        <p>{boolList([
          { label: "Hiperemia", val: data.hiperemia },
          { label: "Resequedad", val: data.resequedad },
          { label: "Secreción", val: data.secrecion },
        ])}{data.examenExternoOtros ? `, ${data.examenExternoOtros}` : ""}</p>
      </div>

      {/* Antecedentes */}
      <div className="mb-3 text-[10px]">
        <span className="font-semibold">Antecedentes: </span>
        {boolList([
          { label: "Diabetes", val: data.antDiabetes },
          { label: "Hipertensión", val: data.antHipertension },
          { label: "Glaucoma", val: data.antGlaucoma },
          { label: "Cirugía", val: data.antCirugia },
        ])}
        {data.lentesDesde && `, Lentes desde ${data.lentesDesde}`}
        {data.antecedentesOtros && `, ${data.antecedentesOtros}`}
      </div>

      {/* Tablas de prescripción */}
      <PrintTable
        label="Lentes en uso"
        mediciones={data.mediciones}
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

      <div className="mb-3 grid grid-cols-2 gap-4">
        <PrintTable
          label="Retinoscopia"
          mediciones={data.mediciones}
          seccion="RETINOSCOPIA"
          cols={[
            { key: "esfera", label: "Esfera" },
            { key: "cilindro", label: "Cilindro" },
            { key: "eje", label: "Eje" },
          ]}
        />
        <div className="space-y-1 text-[10px]">
          <p><span className="font-semibold">Oftalmoscopia:</span> {data.oftalmoscopia ?? ""}</p>
          <p><span className="font-semibold">Queratometría:</span> {data.queratometria ?? ""}</p>
        </div>
      </div>

      <PrintTable
        label="Receta Final"
        mediciones={data.mediciones}
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

      {data.otros && (
        <p className="mb-2 text-[10px]"><span className="font-semibold">Otros:</span> {data.otros}</p>
      )}

      {/* Firma */}
      <div className="mt-6 flex items-end justify-end">
        <div className="text-center text-[10px]">
          <div className="mb-1 h-8 border-b border-gray-400 w-40" />
          <p>Realizado por</p>
          <p className="font-semibold">{data.realizadoById}</p>
        </div>
      </div>

      {data.proximoControl && (
        <p className="mt-3 text-center text-[10px] text-gray-500">
          Próximo control: {format(new Date(data.proximoControl), "dd/MM/yyyy", { locale: es })}
        </p>
      )}
    </div>
  );
}
