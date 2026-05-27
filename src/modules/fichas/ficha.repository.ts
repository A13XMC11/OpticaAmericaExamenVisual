import { createClient } from "@/lib/supabase/server";
import { assertDbError } from "@/modules/shared/errors";
import type { FichaInput, FichaUpdateInput } from "./ficha.schema";

type DbClient = Awaited<ReturnType<typeof createClient>>;

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
  const {
    lentesUsoOD: _lUD,
    lentesUsoOI: _lUI,
    retinoscopiaOD: _rOD,
    retinoscopiaOI: _rOI,
    recetaFinalOD: _rfOD,
    recetaFinalOI: _rfOI,
    ...rest
  } = data;
  return stripUndefined({
    ...rest,
    fecha: rest.fecha === undefined ? undefined : toIso(rest.fecha),
    proximoControl: rest.proximoControl === undefined ? undefined : toIso(rest.proximoControl),
    motivoOtros: rest.motivoOtros === undefined ? undefined : nullIfEmpty(rest.motivoOtros),
    examenExternoOtros:
      rest.examenExternoOtros === undefined ? undefined : nullIfEmpty(rest.examenExternoOtros),
    antecedentesOtros:
      rest.antecedentesOtros === undefined ? undefined : nullIfEmpty(rest.antecedentesOtros),
    oftalmoscopia: rest.oftalmoscopia === undefined ? undefined : nullIfEmpty(rest.oftalmoscopia),
    queratometria: rest.queratometria === undefined ? undefined : nullIfEmpty(rest.queratometria),
    otros: rest.otros === undefined ? undefined : nullIfEmpty(rest.otros),
  });
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

async function hydrateFicha(supabase: DbClient, ficha: FichaDb | null) {
  if (!ficha) return null;

  const [{ data: mediciones, error: medicionesError }, { data: paciente, error: pacienteError }] =
    await Promise.all([
      supabase.from("Medicion").select(medicionColumns).eq("fichaId", ficha.id),
      supabase
        .from("Paciente")
        .select("id,cedula,nombre,apellido")
        .eq("id", ficha.pacienteId)
        .maybeSingle(),
    ]);

  assertDbError(medicionesError);
  assertDbError(pacienteError);

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

  assertDbError(error);
  return Promise.all(((data ?? []) as FichaDb[]).map((ficha) => hydrateFicha(supabase, ficha)));
}

export async function findFichaById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("FichaExamen")
    .select(fichaColumns)
    .eq("id", id)
    .maybeSingle();

  assertDbError(error);
  return hydrateFicha(supabase, data as FichaDb | null);
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

  assertDbError(error);

  const mediciones = buildMediciones(id, data);
  if (mediciones.length) {
    const { error: medicionesError } = await supabase.from("Medicion").insert(mediciones);
    assertDbError(medicionesError);
  }

  return hydrateFicha(supabase, ficha as FichaDb);
}

export async function updateFicha(id: string, data: FichaUpdateInput) {
  const supabase = await createClient();

  const { data: ficha, error } = await supabase
    .from("FichaExamen")
    .update({ ...fichaPayload(data), updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select(fichaColumns)
    .single();

  assertDbError(error);

  const mediciones = buildMediciones(id, data);
  if (mediciones.length > 0) {
    const { error: medicionError } = await supabase
      .from("Medicion")
      .upsert(mediciones, { onConflict: "fichaId,seccion,ojo" });
    assertDbError(medicionError);
  }

  return hydrateFicha(supabase, ficha as FichaDb);
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

  assertDbError(error);

  const fichas = data ?? [];
  const pacienteIds = [...new Set(fichas.map((ficha) => ficha.pacienteId as string))];
  if (pacienteIds.length === 0) return [];

  const { data: pacientes, error: pacientesError } = await supabase
    .from("Paciente")
    .select("id,cedula,nombre,apellido,telefono")
    .is("deletedAt", null)
    .in("id", pacienteIds);

  assertDbError(pacientesError);

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
