"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { read, utils, writeFile } from "xlsx";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, XCircle, Loader2, FileSpreadsheet } from "lucide-react";

const rowSchema = z.object({
  cedula: z.string().min(5),
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  fechaNacimiento: z.string().transform((v) => new Date(v)),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  direccion: z.string().optional(),
  ocupacion: z.string().optional(),
});

interface RowResult {
  row: number;
  data: Record<string, string>;
  error?: string;
  status: "ok" | "error" | "imported" | "importing";
}

function downloadTemplate() {
  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet([
    ["cedula", "nombre", "apellido", "fechaNacimiento", "telefono", "email", "direccion", "ocupacion"],
    ["0000000001", "Juan", "Pérez", "1990-01-15", "0987654321", "juan@email.com", "Calle 1", "Abogado"],
  ]);
  utils.book_append_sheet(wb, ws, "Pacientes");
  writeFile(wb, "plantilla-pacientes.xlsx");
}

export default function ImportarPacientesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RowResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

      const parsed: RowResult[] = json.map((row, i) => {
        const result = rowSchema.safeParse({
          ...row,
          fechaNacimiento: row.fechaNacimiento || row["fecha_nacimiento"] || row["fecha nacimiento"],
        });
        return {
          row: i + 2,
          data: row,
          status: result.success ? "ok" : "error",
          error: result.success ? undefined : result.error.issues[0].message,
        };
      });
      setRows(parsed);
      setDone(false);
    };
    reader.readAsArrayBuffer(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  async function handleImport() {
    setImporting(true);
    const toImport = rows.filter((r) => r.status === "ok");

    for (const row of toImport) {
      setRows((prev) =>
        prev.map((r) => (r.row === row.row ? { ...r, status: "importing" } : r))
      );
      try {
        const res = await fetch("/api/pacientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cedula: row.data.cedula,
            nombre: row.data.nombre,
            apellido: row.data.apellido,
            fechaNacimiento: new Date(row.data.fechaNacimiento),
            telefono: row.data.telefono || null,
            email: row.data.email || null,
            direccion: row.data.direccion || null,
            ocupacion: row.data.ocupacion || null,
          }),
        });
        const json = await res.json();
        setRows((prev) =>
          prev.map((r) =>
            r.row === row.row
              ? { ...r, status: json.success ? "imported" : "error", error: json.success ? undefined : json.error }
              : r
          )
        );
      } catch {
        setRows((prev) =>
          prev.map((r) =>
            r.row === row.row ? { ...r, status: "error", error: "Error de red" } : r
          )
        );
      }
    }

    setImporting(false);
    setDone(true);
  }

  const validRows = rows.filter((r) => r.status === "ok").length;
  const errorRows = rows.filter((r) => r.status === "error").length;
  const importedRows = rows.filter((r) => r.status === "imported").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Importar pacientes</h1>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="mr-1 h-4 w-4" />
          Descargar plantilla
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <FileSpreadsheet className="mb-3 h-10 w-10 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">Arrastra tu archivo CSV o Excel aquí</p>
        <p className="mt-1 text-xs text-gray-500">o</p>
        <label className="mt-2 cursor-pointer">
          <span className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            Seleccionar archivo
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
          />
        </label>
        <p className="mt-2 text-xs text-gray-400">Formatos: .csv, .xlsx, .xls</p>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-700">{validRows} válidos</Badge>
            {errorRows > 0 && <Badge className="bg-red-100 text-red-700">{errorRows} con error</Badge>}
            {importedRows > 0 && <Badge className="bg-blue-100 text-blue-700">{importedRows} importados</Badge>}
          </div>

          <div className="rounded-xl border bg-white shadow-sm overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Fila</th>
                  <th className="px-3 py-2 text-left">Cédula</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-left">Apellido</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.row} className={r.status === "error" ? "bg-red-50" : r.status === "imported" ? "bg-green-50" : ""}>
                    <td className="px-3 py-1.5 text-gray-500">{r.row}</td>
                    <td className="px-3 py-1.5 font-mono">{r.data.cedula}</td>
                    <td className="px-3 py-1.5">{r.data.nombre}</td>
                    <td className="px-3 py-1.5">{r.data.apellido}</td>
                    <td className="px-3 py-1.5">
                      {r.status === "ok" && <span className="text-green-600">✓ Listo</span>}
                      {r.status === "imported" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {r.status === "importing" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                      {r.status === "error" && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {r.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            {done ? (
              <Button onClick={() => router.push("/pacientes")}>
                Ver pacientes
              </Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={importing || validRows === 0}
              >
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                Importar {validRows} paciente{validRows !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
