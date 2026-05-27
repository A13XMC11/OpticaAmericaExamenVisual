import { createClient } from "@/lib/supabase/server";

export type AuditAccion =
  | "crear_paciente"
  | "editar_paciente"
  | "eliminar_paciente"
  | "crear_ficha"
  | "editar_ficha";

export async function logAudit(params: {
  userId: string;
  accion: AuditAccion;
  entidad: string;
  entidadId?: string;
  fichaId?: string;
  cambios?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("AuditLog").insert({
      id: crypto.randomUUID(),
      userId: params.userId,
      accion: params.accion,
      entidad: params.entidad,
      entidadId: params.entidadId ?? null,
      fichaId: params.fichaId ?? null,
      cambios: params.cambios ?? null,
      ip: params.ip ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
