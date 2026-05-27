import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findPacientes, createPaciente } from "@/modules/pacientes/paciente.repository";
import { pacienteSchema } from "@/modules/pacientes/paciente.schema";
import { puedeGestionarPacientes } from "@/modules/auth/rbac";
import { ok, fail } from "@/modules/shared/api-response";
import { toErrorMessage, DuplicateCedulaError } from "@/modules/shared/errors";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeGestionarPacientes(user)) {
      return NextResponse.json(fail("No autorizado"), { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const q = searchParams.get("q") ?? undefined;
    const rawTagId = searchParams.get("tagId") ?? undefined;
    const tagId = rawTagId
      ? z.string().uuid().safeParse(rawTagId).success ? rawTagId : undefined
      : undefined;

    const { data, total } = await findPacientes({ page, limit, q, tagId });
    return NextResponse.json(ok(data, { total, page, limit }));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeGestionarPacientes(user)) {
      return NextResponse.json(fail("No autorizado"), { status: 401 });
    }

    const body = await request.json();
    const parsed = pacienteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
    }

    const paciente = await createPaciente({ ...parsed.data, createdById: user.id });
    return NextResponse.json(ok(paciente), { status: 201 });
  } catch (err) {
    if (err instanceof DuplicateCedulaError) {
      return NextResponse.json(fail(err.message), { status: err.status });
    }
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}
