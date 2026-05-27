import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { puedeGestionarPacientes } from "@/modules/auth/rbac";
import { ok, fail } from "@/modules/shared/api-response";
import { toErrorMessage } from "@/modules/shared/errors";

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

    return NextResponse.json(ok(data ?? []));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}
