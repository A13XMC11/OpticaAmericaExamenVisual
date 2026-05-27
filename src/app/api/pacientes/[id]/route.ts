import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findPacienteById,
  updatePaciente,
  softDeletePaciente,
} from "@/modules/pacientes/paciente.repository";
import { pacienteUpdateSchema } from "@/modules/pacientes/paciente.schema";
import {
  puedeGestionarPacientes,
  puedeEliminarPaciente,
} from "@/modules/auth/rbac";
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
    const paciente = await findPacienteById(id);
    if (!paciente) return NextResponse.json(fail("Paciente no encontrado"), { status: 404 });

    return NextResponse.json(ok(paciente));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
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
    const body = await request.json();
    const parsed = pacienteUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 });
    }

    const paciente = await updatePaciente(id, parsed.data);
    return NextResponse.json(ok(paciente));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !puedeEliminarPaciente(user)) {
      return NextResponse.json(fail("Sin permisos para eliminar"), { status: 403 });
    }

    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(fail("ID inválido"), { status: 400 });
    }
    await softDeletePaciente(id);
    return NextResponse.json(ok({ id }));
  } catch (err) {
    return NextResponse.json(fail(toErrorMessage(err)), { status: 500 });
  }
}
