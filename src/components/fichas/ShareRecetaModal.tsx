"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Copy, CheckCheck } from "lucide-react";

interface ShareRecetaModalProps {
  fichaId: string;
  onClose: () => void;
}

function buildTextoReceta(ficha: Record<string, unknown>): string {
  const mediciones = (ficha.mediciones as Array<Record<string, string>>) ?? [];
  const recetaOD = mediciones.find((m) => m.seccion === "RECETA_FINAL" && m.ojo === "OD");
  const recetaOI = mediciones.find((m) => m.seccion === "RECETA_FINAL" && m.ojo === "OI");
  const paciente = ficha.paciente as Record<string, string>;

  const lineas = [
    `*Óptica América — Receta Visual*`,
    `Paciente: ${paciente?.nombre} ${paciente?.apellido}`,
    `Cédula: ${paciente?.cedula}`,
    `Fecha: ${ficha.fecha ? new Date(ficha.fecha as string).toLocaleDateString("es-EC") : ""}`,
    ``,
    `*Receta Final:*`,
    `OD — Esfera: ${recetaOD?.esfera ?? ""} | Cilindro: ${recetaOD?.cilindro ?? ""} | Eje: ${recetaOD?.eje ?? ""} | Adición: ${recetaOD?.adicion ?? ""} | AV: ${recetaOD?.av ?? ""}`,
    `OI — Esfera: ${recetaOI?.esfera ?? ""} | Cilindro: ${recetaOI?.cilindro ?? ""} | Eje: ${recetaOI?.eje ?? ""} | Adición: ${recetaOI?.adicion ?? ""} | AV: ${recetaOI?.av ?? ""}`,
    ficha.otros ? `\nObservaciones: ${ficha.otros}` : "",
  ];

  return lineas.filter(Boolean).join("\n");
}

export function ShareRecetaModal({ fichaId, onClose }: ShareRecetaModalProps) {
  const [ficha, setFicha] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/fichas/${fichaId}`)
      .then((r) => r.json())
      .then((j) => setFicha(j.data));
  }, [fichaId]);

  const texto = ficha ? buildTextoReceta(ficha) : "";
  const paciente = ficha?.paciente as Record<string, string> | undefined;
  const telefono = paciente?.telefono?.replace(/\D/g, "") ?? "";

  function handleWhatsApp() {
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  }

  function handleEmail() {
    const subject = encodeURIComponent("Receta Visual — Óptica América");
    const body = encodeURIComponent(texto);
    const email = paciente?.email ?? "";
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartir receta</DialogTitle>
        </DialogHeader>

        {!ficha ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <div className="space-y-3">
            <pre className="rounded-md bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-700 border max-h-40 overflow-y-auto">
              {texto}
            </pre>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                onClick={handleWhatsApp}
                disabled={!telefono}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                Enviar por WhatsApp
                {!telefono && <span className="text-xs text-gray-400">(sin teléfono)</span>}
              </Button>
              <Button
                variant="outline"
                onClick={handleEmail}
                disabled={!paciente?.email}
                className="gap-2"
              >
                <Mail className="h-4 w-4 text-blue-600" />
                Enviar por email
                {!paciente?.email && <span className="text-xs text-gray-400">(sin email)</span>}
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? (
                  <CheckCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "¡Copiado!" : "Copiar texto"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
