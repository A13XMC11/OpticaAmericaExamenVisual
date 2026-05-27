import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { puedeGestionarPacientes } from "@/modules/auth/rbac";
import { ok, fail } from "@/modules/shared/api-response";
import { toErrorMessage } from "@/modules/shared/errors";

const DEFAULT_TAGS = [
  { nombre: "Diabético", color: "#EF4444" },
  { nombre: "Menor de edad", color: "#F59E0B" },
  { nombre: "Alta graduación", color: "#8B5CF6" },
  { nombre: "Pendiente de gafas", color: "#3B82F6" },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !puedeGestionarPacientes(user)) {
      return NextResponse.json(fail("No autorizado"), { status: 401 });
    }

    const { data, error } = await supabase
      .from("Tag")
      .select("id,nombre,color")
      .order("nombre", { ascending: true });

    if (error) throw new Error(error.message);
    if (data.length > 0) return NextResponse.json(ok(data));

    const { data: created, error: createError } = await supabase
      .from("Tag")
      .insert(DEFAULT_TAGS.map((tag) => ({ id: crypto.randomUUID(), ...tag })))
      .select("id,nombre,color")
      .order("nombre", { ascending: true });

    if (createError) throw new Error(createError.message);

    return NextResponse.json(ok(created ?? []));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}
