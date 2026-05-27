import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findFichasByPaciente, createFicha } from "@/modules/fichas/ficha.repository";
import { fichaSchema } from "@/modules/fichas/ficha.schema";
import { puedeCrearFicha, puedeGestionarPacientes } from "@/modules/auth/rbac";
import { ok, fail } from "@/modules/shared/api-response";
import { toErrorMessage } from "@/modules/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeGestionarPacientes(user)) {
      return NextResponse.json(fail("No autorizado"), { status: 401 });
    }

    const pacienteId = request.nextUrl.searchParams.get("pacienteId");
    if (!pacienteId) {
      return NextResponse.json(fail("pacienteId requerido"), { status: 400 });
    }

    const fichas = await findFichasByPaciente(pacienteId);
    return NextResponse.json(ok(fichas));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeCrearFicha(user)) {
      return NextResponse.json(fail("Sin permisos para crear fichas"), { status: 403 });
    }

    const body = await request.json();
    const parsed = fichaSchema.safeParse({ ...body, realizadoById: body.realizadoById ?? user.id });
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
    }

    const ficha = await createFicha(parsed.data);
    return NextResponse.json(ok(ficha), { status: 201 });
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}
