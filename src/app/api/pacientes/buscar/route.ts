import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchPacientes } from "@/modules/pacientes/paciente.repository";
import { puedeGestionarPacientes } from "@/modules/auth/rbac";
import { ok, fail } from "@/modules/shared/api-response";
import { toErrorMessage } from "@/modules/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeGestionarPacientes(user)) {
      return NextResponse.json(fail("No autorizado"), { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q") ?? "";
    if (q.length < 1) {
      return NextResponse.json(ok([]));
    }

    const resultados = await searchPacientes(q);
    return NextResponse.json(ok(resultados));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}
