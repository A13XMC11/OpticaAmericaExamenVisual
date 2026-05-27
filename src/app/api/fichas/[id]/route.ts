import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findFichaById, updateFicha } from "@/modules/fichas/ficha.repository";
import { fichaUpdateSchema } from "@/modules/fichas/ficha.schema";
import { puedeCrearFicha, puedeGestionarPacientes } from "@/modules/auth/rbac";
import { ok, fail } from "@/modules/shared/api-response";
import { toErrorMessage } from "@/modules/shared/errors";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeGestionarPacientes(user)) {
      return NextResponse.json(fail("No autorizado"), { status: 401 });
    }

    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(fail("ID inválido"), { status: 400 });
    }
    const ficha = await findFichaById(id);
    if (!ficha) return NextResponse.json(fail("Ficha no encontrada"), { status: 404 });

    return NextResponse.json(ok(ficha));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeCrearFicha(user)) {
      return NextResponse.json(fail("Sin permisos para editar fichas"), { status: 403 });
    }

    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(fail("ID inválido"), { status: 400 });
    }
    const body = await request.json();
    const parsed = fichaUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
    }

    const ficha = await updateFicha(id, parsed.data);
    return NextResponse.json(ok(ficha));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}
