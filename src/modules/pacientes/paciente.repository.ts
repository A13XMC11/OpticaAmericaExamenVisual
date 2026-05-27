import { createClient } from "@/lib/supabase/server";
import type { PacienteInput, PacienteUpdateInput } from "./paciente.schema";

export type PacienteRow = {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  telefono: string | null;
  direccion: string | null;
  ocupacion: string | null;
  email: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  tags: { tag: { id: string; nombre: string; color: string } }[];
  _count: { fichas: number };
};

type PacienteDb = Omit<PacienteRow, "fechaNacimiento" | "createdAt" | "updatedAt" | "tags" | "_count"> & {
  fechaNacimiento: string;
  createdAt: string;
  updatedAt: string;
};

type TagDb = { id: string; nombre: string; color: string };
type PacienteTagDb = { pacienteId: string; tagId: string };
type FichaCountDb = { pacienteId: string };

const pacienteColumns =
  "id,cedula,nombre,apellido,fechaNacimiento,telefono,direccion,ocupacion,email,createdById,createdAt,updatedAt";

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toPacienteRow(
  row: PacienteDb,
  tagsByPaciente: Map<string, { tag: TagDb }[]> = new Map(),
  fichaCountByPaciente: Map<string, number> = new Map()
): PacienteRow {
  return {
    ...row,
    fechaNacimiento: new Date(row.fechaNacimiento),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    tags: tagsByPaciente.get(row.id) ?? [],
    _count: { fichas: fichaCountByPaciente.get(row.id) ?? 0 },
  };
}

async function hydratePacientes(rows: PacienteDb[]) {
  if (rows.length === 0) return [];

  const supabase = await createClient();
  const ids = rows.map((row) => row.id);

  const [{ data: pacienteTags, error: pacienteTagsError }, { data: fichas, error: fichasError }] =
    await Promise.all([
      supabase.from("PacienteTag").select("pacienteId,tagId").in("pacienteId", ids),
      supabase.from("FichaExamen").select("pacienteId").in("pacienteId", ids),
    ]);

  assertNoError(pacienteTagsError);
  assertNoError(fichasError);

  const tagIds = [...new Set(((pacienteTags ?? []) as PacienteTagDb[]).map((row) => row.tagId))];
  const { data: tags, error: tagsError } = tagIds.length
    ? await supabase.from("Tag").select("id,nombre,color").in("id", tagIds)
    : { data: [], error: null };

  assertNoError(tagsError);

  const tagById = new Map((tags ?? []).map((tag) => [tag.id, tag as TagDb]));
  const tagsByPaciente = new Map<string, { tag: TagDb }[]>();
  for (const row of (pacienteTags ?? []) as PacienteTagDb[]) {
    const tag = tagById.get(row.tagId);
    if (!tag) continue;
    tagsByPaciente.set(row.pacienteId, [...(tagsByPaciente.get(row.pacienteId) ?? []), { tag }]);
  }

  const fichaCountByPaciente = new Map<string, number>();
  for (const ficha of (fichas ?? []) as FichaCountDb[]) {
    fichaCountByPaciente.set(ficha.pacienteId, (fichaCountByPaciente.get(ficha.pacienteId) ?? 0) + 1);
  }

  return rows.map((row) => toPacienteRow(row, tagsByPaciente, fichaCountByPaciente));
}

export async function findPacientes(opts: {
  page: number;
  limit: number;
  q?: string;
  tagId?: string;
}) {
  const { page, limit, q, tagId } = opts;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = await createClient();

  let allowedIds: string[] | null = null;
  if (tagId) {
    const { data, error } = await supabase
      .from("PacienteTag")
      .select("pacienteId")
      .eq("tagId", tagId);
    assertNoError(error);
    allowedIds = [...new Set((data ?? []).map((row) => row.pacienteId as string))];
    if (allowedIds.length === 0) return { data: [], total: 0 };
  }

  let query = supabase
    .from("Paciente")
    .select(pacienteColumns, { count: "exact" })
    .is("deletedAt", null)
    .order("updatedAt", { ascending: false })
    .range(from, to);

  if (q) {
    const safe = q.replaceAll(",", "\\,");
    query = query.or(`cedula.ilike.%${safe}%,nombre.ilike.%${safe}%,apellido.ilike.%${safe}%`);
  }

  if (allowedIds) query = query.in("id", allowedIds);

  const { data, error, count } = await query;
  assertNoError(error);

  return { data: await hydratePacientes((data ?? []) as PacienteDb[]), total: count ?? 0 };
}

export async function findPacienteByCedula(cedula: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Paciente")
    .select(pacienteColumns)
    .is("deletedAt", null)
    .ilike("cedula", `%${cedula}%`)
    .order("updatedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  assertNoError(error);
  const rows = data ? await hydratePacientes([data as PacienteDb]) : [];
  return rows[0] ?? null;
}

export async function searchPacientes(q: string) {
  const supabase = await createClient();
  const safe = q.replaceAll(",", "\\,");
  const { data, error } = await supabase
    .from("Paciente")
    .select(pacienteColumns)
    .is("deletedAt", null)
    .or(`cedula.ilike.%${safe}%,nombre.ilike.%${safe}%,apellido.ilike.%${safe}%`)
    .order("updatedAt", { ascending: false })
    .limit(8);

  assertNoError(error);
  return hydratePacientes((data ?? []) as PacienteDb[]);
}

export async function findPacienteById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Paciente")
    .select(pacienteColumns)
    .eq("id", id)
    .is("deletedAt", null)
    .maybeSingle();

  assertNoError(error);
  if (!data) return null;

  const [paciente] = await hydratePacientes([data as PacienteDb]);
  const { data: fichas, error: fichasError } = await supabase
    .from("FichaExamen")
    .select(
      "id,fecha,edadSnapshot,ultimoExamenVisual,realizadoById,proximoControl,motivoControl,motivoNoVeLejos,motivoNoVeCerca,motivoCefalea,motivoHiperemia,motivoOtros,createdAt"
    )
    .eq("pacienteId", id)
    .order("fecha", { ascending: false });

  assertNoError(fichasError);

  return { ...paciente, fichas: fichas ?? [] };
}

export async function createPaciente(data: PacienteInput & { createdById: string }) {
  const { tagIds, ...rest } = data;
  const supabase = await createClient();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const { data: paciente, error } = await supabase
    .from("Paciente")
    .insert({
      ...rest,
      id,
      fechaNacimiento: toIso(rest.fechaNacimiento),
      telefono: rest.telefono || null,
      direccion: rest.direccion || null,
      ocupacion: rest.ocupacion || null,
      email: rest.email || null,
      createdAt: now,
      updatedAt: now,
    })
    .select(pacienteColumns)
    .single();

  assertNoError(error);

  if (tagIds?.length) {
    const { error: tagsError } = await supabase
      .from("PacienteTag")
      .insert(tagIds.map((tagId) => ({ pacienteId: id, tagId })));
    assertNoError(tagsError);
  }

  const [row] = await hydratePacientes([paciente as PacienteDb]);
  return row;
}

export async function updatePaciente(id: string, data: PacienteUpdateInput) {
  const { tagIds, ...rest } = data;
  const supabase = await createClient();
  const payload = {
    ...rest,
    ...(rest.fechaNacimiento && { fechaNacimiento: toIso(rest.fechaNacimiento) }),
    ...(rest.telefono !== undefined && { telefono: rest.telefono || null }),
    ...(rest.direccion !== undefined && { direccion: rest.direccion || null }),
    ...(rest.ocupacion !== undefined && { ocupacion: rest.ocupacion || null }),
    ...(rest.email !== undefined && { email: rest.email || null }),
    updatedAt: new Date().toISOString(),
  };

  const { data: paciente, error } = await supabase
    .from("Paciente")
    .update(payload)
    .eq("id", id)
    .select(pacienteColumns)
    .single();

  assertNoError(error);

  if (tagIds !== undefined) {
    const { error: deleteError } = await supabase.from("PacienteTag").delete().eq("pacienteId", id);
    assertNoError(deleteError);

    if (tagIds.length) {
      const { error: insertError } = await supabase
        .from("PacienteTag")
        .insert(tagIds.map((tagId) => ({ pacienteId: id, tagId })));
      assertNoError(insertError);
    }
  }

  const [row] = await hydratePacientes([paciente as PacienteDb]);
  return row;
}

export async function softDeletePaciente(id: string) {
  const { error } = await (await createClient())
    .from("Paciente")
    .update({ deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .eq("id", id);

  assertNoError(error);
}
