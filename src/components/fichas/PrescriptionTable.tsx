"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Seccion = "lentesUso" | "retinoscopia" | "recetaFinal";

interface Col {
  key: string;
  label: string;
  width?: string;
}

const colsBySeccion: Record<Seccion, Col[]> = {
  lentesUso: [
    { key: "esfera", label: "Esfera" },
    { key: "cilindro", label: "Cilindro" },
    { key: "eje", label: "Eje" },
    { key: "adicion", label: "Adición" },
    { key: "avSinLentes", label: "A.V. sin lentes", width: "w-28" },
    { key: "avConLentes", label: "A.V. con lentes", width: "w-28" },
  ],
  retinoscopia: [
    { key: "esfera", label: "Esfera" },
    { key: "cilindro", label: "Cilindro" },
    { key: "eje", label: "Eje" },
  ],
  recetaFinal: [
    { key: "esfera", label: "Esfera" },
    { key: "cilindro", label: "Cilindro" },
    { key: "eje", label: "Eje" },
    { key: "av", label: "A.V." },
    { key: "binocular", label: "Binocular" },
    { key: "adicion", label: "Adición" },
    { key: "dp", label: "D.P." },
  ],
};

interface PrescriptionTableProps {
  seccion: Seccion;
  readOnly?: boolean;
  valueOD?: Record<string, string>;
  valueOI?: Record<string, string>;
}

export function PrescriptionTable({ seccion, readOnly = false, valueOD, valueOI }: PrescriptionTableProps) {
  const cols = colsBySeccion[seccion];
  const ctx = useFormContext();
  const register = ctx?.register;

  function cell(ojo: "OD" | "OI", colKey: string) {
    const fieldName = `${seccion}${ojo}.${colKey}`;
    const staticVal = ojo === "OD" ? valueOD?.[colKey] : valueOI?.[colKey];

    if (readOnly) {
      return (
        <td key={colKey} className="border px-2 py-1 text-center text-sm">
          {staticVal ?? ""}
        </td>
      );
    }

    return (
      <td key={colKey} className="border p-0">
        <Input
          {...(register ? register(fieldName) : {})}
          className="h-8 rounded-none border-0 text-center text-sm focus-visible:ring-1 focus-visible:ring-inset"
          placeholder="-"
        />
      </td>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="w-12 border px-2 py-1 text-left text-xs font-medium text-gray-500" />
            {cols.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "border px-2 py-1 text-center text-xs font-medium text-gray-600",
                  col.width
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["OD", "OI"] as const).map((ojo) => (
            <tr key={ojo}>
              <td className="border bg-gray-50 px-2 py-1 text-center text-xs font-semibold text-gray-700">
                {ojo}
              </td>
              {cols.map((col) => cell(ojo, col.key))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
