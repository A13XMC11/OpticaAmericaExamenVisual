import { createClient } from "@/lib/supabase/server";
import type { FichaInput, FichaUpdateInput } from "./ficha.schema";

type SeccionMedicion = "LENTES_USO" | "RETINOSCOPIA" | "RECETA_FINAL";
type Ojo = "OD" | "OI";
type MedicionPayload = Record<string, string | undefined>;

type MedicionDb = {
  id: string;
  fichaId: string;
  seccion: SeccionMedicion;
  ojo: Ojo;
  esfera: string | null;
  cilindro: string | null;
  eje: string | null;
  adicion: string | null;
  av: string | null;
  avSinLentes: string | null;
  avConLentes: string | null;
  binocular: string | null;
  dp: string | null;
};

type FichaDb = {
  id: string;
  pacienteId: string;
  fecha: string;
  edadSnapshot: number | null;
  ultimoExamenVisual: string | null;
  realizadoById: string;
  proximoControl: string | null;
  motivoControl: boolean;
  motivoNoVeLejos: boolean;
  motivoNoVeCerca: boolean;
  motivoCefalea: boolean;
  motivoHiperemia: boolean;
  motivoOtros: string | null;
  pterigiumOD: string | null;
  pterigiumOI: string | null;
  pingueculaOD: string | null;
  pingueculaOI: string | null;
  hiperemia: boolean;
  resequedad: boolean;
  secrecion: boolean;
  examenExternoOtros: string | null;
  antDiabetes: boolean;
  antHipertension: boolean;
  antGlaucoma: boolean;
  antCirugia: boolean;
  lentesDesde: number | null;
  antecedentesOtros: string | null;
  oftalmoscopia: string | null;
  queratometria: string | null;
  otros: string | null;
  createdAt: string;
  updatedAt: string;
};

const fichaColumns =
  "id,pacienteId,fecha,edadSnapshot,ultimoExamenVisual,realizadoById,proximoControl,motivoControl,motivoNoVeLejos,motivoNoVeCerca,motivoCefalea,motivoHiperemia,motivoOtros,pterigiumOD,pterigiumOI,pingueculaOD,pingueculaOI,hiperemia,resequedad,secrecion,examenExternoOtros,antDiabetes,antHipertension,antGlaucoma,antCirugia,lentesDesde,antecedentesOtros,oftalmoscopia,queratometria,otros,createdAt,updatedAt";

const medicionColumns =
  "id,fichaId,seccion,ojo,esfera,cilindro,eje,adicion,av,avSinLentes,avConLentes,binocular,dp";

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

function nullIfEmpty(value: unknown) {
  return value === "" ? null : value;
}

function fichaPayload(data: Partial<FichaInput | FichaUpdateInput>) {
  const payload = stripUndefined({
    ...data,
    fecha: data.fecha === undefined ? undefined : toIso(data.fecha),
    proximoControl: data.proximoControl === undefined ? undefined : toIso(data.proximoControl),
    motivoOtros: data.motivoOtros === undefined ? undefined : nullIfEmpty(data.motivoOtros),
    examenExternoOtros:
      data.examenExternoOtros === undefined ? undefined : nullIfEmpty(data.examenExternoOtros),
    antecedentesOtros:
      data.antecedentesOtros === undefined ? undefined : nullIfEmpty(data.antecedentesOtros),
    oftalmoscopia: data.oftalmoscopia === undefined ? undefined : nullIfEmpty(data.oftalmoscopia),
    queratometria: data.queratometria === undefined ? undefined : nullIfEmpty(data.queratometria),
    otros: data.otros === undefined ? undefined : nullIfEmpty(data.otros),
  });

  delete payload.lentesUsoOD;
  delete payload.lentesUsoOI;
  delete payload.retinoscopiaOD;
  delete payload.retinoscopiaOI;
  delete payload.recetaFinalOD;
  delete payload.recetaFinalOI;

  return payload;
}

function medicionPayload(fichaId: string, seccion: SeccionMedicion, ojo: Ojo, value?: MedicionPayload) {
  if (!value) return null;
  return {
    id: crypto.randomUUID(),
    fichaId,
    seccion,
    ojo,
    esfera: value.esfera || null,
    cilindro: value.cilindro || null,
    eje: value.eje || null,
    adicion: value.adicion || null,
    av: value.av || null,
    avSinLentes: value.avSinLentes || null,
    avConLentes: value.avConLentes || null,
    binocular: value.binocular || null,
    dp: value.dp || null,
  };
}

function buildMediciones(fichaId: string, data: Partial<FichaInput | FichaUpdateInput>) {
  return [
    medicionPayload(fichaId, "LENTES_USO", "OD", data.lentesUsoOD),
    medicionPayload(fichaId, "LENTES_USO", "OI", data.lentesUsoOI),
    medicionPayload(fichaId, "RETINOSCOPIA", "OD", data.retinoscopiaOD),
    medicionPayload(fichaId, "RETINOSCOPIA", "OI", data.retinoscopiaOI),
    medicionPayload(fichaId, "RECETA_FINAL", "OD", data.recetaFinalOD),
    medicionPayload(fichaId, "RECETA_FINAL", "OI", data.recetaFinalOI),
  ].filter((medicion): medicion is NonNullable<typeof medicion> => medicion !== null);
}

async function hydrateFicha(ficha: FichaDb | null) {
  if (!ficha) return null;

  const supabase = await createClient();
  const [{ data: mediciones, error: medicionesError }, { data: paciente, error: pacienteError }] =
    await Promise.all([
      supabase.from("Medicion").select(medicionColumns).eq("fichaId", ficha.id),
      supabase
        .from("Paciente")
        .select("id,cedula,nombre,apellido")
        .eq("id", ficha.pacienteId)
        .maybeSingle(),
    ]);

  assertNoError(medicionesError);
  assertNoError(pacienteError);

  return {
    ...ficha,
    fecha: new Date(ficha.fecha),
    proximoControl: ficha.proximoControl ? new Date(ficha.proximoControl) : null,
    createdAt: new Date(ficha.createdAt),
    updatedAt: new Date(ficha.updatedAt),
    mediciones: (mediciones ?? []) as MedicionDb[],
    paciente,
  };
}

export async function findFichasByPaciente(pacienteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("FichaExamen")
    .select(fichaColumns)
    .eq("pacienteId", pacienteId)
    .order("fecha", { ascending: false });

  assertNoError(error);
  return Promise.all(((data ?? []) as FichaDb[]).map((ficha) => hydrateFicha(ficha)));
}

export async function findFichaById(id: string) {
  const { data, error } = await (await createClient())
    .from("FichaExamen")
    .select(fichaColumns)
    .eq("id", id)
    .maybeSingle();

  assertNoError(error);
  return hydrateFicha(data as FichaDb | null);
}

export async function createFicha(data: FichaInput) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const { data: ficha, error } = await supabase
    .from("FichaExamen")
    .insert({
      ...fichaPayload(data),
      id,
      fecha: toIso(data.fecha) ?? now,
      createdAt: now,
      updatedAt: now,
    })
    .select(fichaColumns)
    .single();

  assertNoError(error);

  const mediciones = buildMediciones(id, data);
  if (mediciones.length) {
    const { error: medicionesError } = await supabase.from("Medicion").insert(mediciones);
    assertNoError(medicionesError);
  }

  return hydrateFicha(ficha as FichaDb);
}

export async function updateFicha(id: string, data: FichaUpdateInput) {
  const supabase = await createClient();

  const { data: ficha, error } = await supabase
    .from("FichaExamen")
    .update({ ...fichaPayload(data), updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select(fichaColumns)
    .single();

  assertNoError(error);

  const mediciones = buildMediciones(id, data);
  for (const medicion of mediciones) {
    const { error: medicionError } = await supabase
      .from("Medicion")
      .upsert(medicion, { onConflict: "fichaId,seccion,ojo" });
    assertNoError(medicionError);
  }

  return hydrateFicha(ficha as FichaDb);
}

export async function findProximosControles(days = 30) {
  const desde = new Date();
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + days);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("FichaExamen")
    .select("id,proximoControl,pacienteId")
    .gte("proximoControl", desde.toISOString())
    .lte("proximoControl", hasta.toISOString())
    .order("proximoControl", { ascending: true })
    .limit(20);

  assertNoError(error);

  const fichas = data ?? [];
  const pacienteIds = [...new Set(fichas.map((ficha) => ficha.pacienteId as string))];
  if (pacienteIds.length === 0) return [];

  const { data: pacientes, error: pacientesError } = await supabase
    .from("Paciente")
    .select("id,cedula,nombre,apellido,telefono")
    .is("deletedAt", null)
    .in("id", pacienteIds);

  assertNoError(pacientesError);

  const pacienteById = new Map((pacientes ?? []).map((paciente) => [paciente.id, paciente]));

  return fichas
    .map((ficha) => ({
      id: ficha.id,
      proximoControl: ficha.proximoControl,
      paciente: pacienteById.get(ficha.pacienteId),
    }))
    .filter(
      (
        ficha
      ): ficha is {
        id: string;
        proximoControl: string | null;
        paciente: { id: string; cedula: string; nombre: string; apellido: string; telefono: string | null };
      } => Boolean(ficha.paciente)
    );
}
