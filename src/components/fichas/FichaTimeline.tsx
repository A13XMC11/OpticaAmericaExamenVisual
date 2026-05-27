"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Printer, Download, GitCompare, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ShareRecetaModal } from "./ShareRecetaModal";
import { useReactToPrint } from "react-to-print";
import { FichaPrintView } from "./FichaPrintView";
import { useRouter } from "next/navigation";

interface Ficha {
  id: string;
  fecha: string;
  edadSnapshot?: number | null;
  realizadoById: string;
  proximoControl?: string | null;
  motivoControl: boolean;
  motivoNoVeLejos: boolean;
  motivoNoVeCerca: boolean;
  motivoCefalea: boolean;
  motivoHiperemia: boolean;
  motivoOtros?: string | null;
  createdAt: string;
}

interface FichaTimelineProps {
  fichas: Ficha[];
  pacienteId: string;
  puedeCrear: boolean;
}

function motivosLabel(f: Ficha): string {
  const m = [];
  if (f.motivoControl) m.push("Control");
  if (f.motivoNoVeLejos) m.push("No ve lejos");
  if (f.motivoNoVeCerca) m.push("No ve cerca");
  if (f.motivoCefalea) m.push("Cefalea");
  if (f.motivoHiperemia) m.push("Hiperemia");
  if (f.motivoOtros) m.push(f.motivoOtros);
  return m.join(", ") || "—";
}

export function FichaTimeline({ fichas, pacienteId, puedeCrear }: FichaTimelineProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareId, setShareId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handlePrint = useReactToPrint({ contentRef: printRef });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(fichas.map((f) => f.id)));
  }

  const selectedFichas = fichas.filter((f) => selected.has(f.id));

  async function handleExportPDF() {
    const { exportFichasPDF } = await import("./FichaExportPDF");
    await exportFichasPDF(selectedFichas.map((f) => f.id));
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            Fichas de examen
            <span className="ml-2 text-sm font-normal text-gray-500">({fichas.length})</span>
          </h2>
          {fichas.length > 0 && (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Seleccionar todas
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {selected.size >= 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                router.push(
                  `/pacientes/${pacienteId}/comparar?ids=${[...selected].slice(0, 2).join(",")}`
                )
              }
            >
              <GitCompare className="mr-1 h-3.5 w-3.5" />
              Comparar
            </Button>
          )}
          {selected.size > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={() => handlePrint()}>
                <Printer className="mr-1 h-3.5 w-3.5" />
                Imprimir ({selected.size})
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportPDF}>
                <Download className="mr-1 h-3.5 w-3.5" />
                PDF ({selected.size})
              </Button>
            </>
          )}
          {puedeCrear && (
            <ButtonLink href={`/fichas/nueva?pacienteId=${pacienteId}`} size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nueva ficha
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Lista */}
      {fichas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-gray-400">
          <FileText className="h-10 w-10" />
          <p className="text-sm">Aún no hay fichas de examen para este paciente</p>
          {puedeCrear && (
            <ButtonLink href={`/fichas/nueva?pacienteId=${pacienteId}`} size="sm">
              Crear primera ficha
            </ButtonLink>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {fichas.map((ficha) => (
            <div
              key={ficha.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                selected.has(ficha.id) ? "border-blue-300 bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <Checkbox
                checked={selected.has(ficha.id)}
                onCheckedChange={() => toggleSelect(ficha.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {format(new Date(ficha.fecha), "dd MMM yyyy", { locale: es })}
                  </span>
                  {ficha.edadSnapshot && (
                    <Badge variant="outline" className="text-xs">
                      {ficha.edadSnapshot} años
                    </Badge>
                  )}
                  {ficha.proximoControl && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">
                      Control: {format(new Date(ficha.proximoControl), "dd/MM/yyyy")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  Motivo: {motivosLabel(ficha)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShareId(ficha.id)}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                <ButtonLink href={`/fichas/${ficha.id}`} variant="ghost" size="sm">Ver</ButtonLink>
                <ButtonLink href={`/fichas/${ficha.id}/editar`} variant="ghost" size="sm">Editar</ButtonLink>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print area (hidden) */}
      <div className="hidden">
        <div ref={printRef}>
          {selectedFichas.map((f) => (
            <FichaPrintView key={f.id} fichaId={f.id} />
          ))}
        </div>
      </div>

      {/* Share modal */}
      {shareId && (
        <ShareRecetaModal fichaId={shareId} onClose={() => setShareId(null)} />
      )}
    </div>
  );
}
