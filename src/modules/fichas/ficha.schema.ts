import { z } from "zod";

const medidaOptica = z
  .string()
  .regex(/^[+-]?\d+(\.\d{1,2})?$/, "Formato inválido (ej: +1.25 o -0.50)")
  .optional()
  .or(z.literal(""));

const medicionSchema = z.object({
  esfera: medidaOptica,
  cilindro: medidaOptica,
  eje: z.string().regex(/^\d{1,3}$/, "El eje debe ser un número entre 0 y 180").optional().or(z.literal("")),
  adicion: medidaOptica,
  av: z.string().max(20).optional(),
  avSinLentes: z.string().max(20).optional(),
  avConLentes: z.string().max(20).optional(),
  binocular: z.string().max(20).optional(),
  dp: z.string().max(10).optional(),
});

export const fichaSchema = z.object({
  pacienteId: z.string().uuid(),
  fecha: z.coerce.date().optional(),
  edadSnapshot: z.coerce.number().int().min(0).max(120).optional(),
  ultimoExamenVisual: z.string().max(100).optional(),
  realizadoById: z.string().uuid(),
  proximoControl: z.coerce.date().optional().nullable(),

  // Motivo de consulta
  motivoControl: z.boolean().default(false),
  motivoNoVeLejos: z.boolean().default(false),
  motivoNoVeCerca: z.boolean().default(false),
  motivoCefalea: z.boolean().default(false),
  motivoHiperemia: z.boolean().default(false),
  motivoOtros: z.string().max(200).optional(),

  // Examen externo
  pterigiumOD: z.string().max(100).optional(),
  pterigiumOI: z.string().max(100).optional(),
  pingueculaOD: z.string().max(100).optional(),
  pingueculaOI: z.string().max(100).optional(),
  hiperemia: z.boolean().default(false),
  resequedad: z.boolean().default(false),
  secrecion: z.boolean().default(false),
  examenExternoOtros: z.string().max(200).optional(),

  // Antecedentes
  antDiabetes: z.boolean().default(false),
  antHipertension: z.boolean().default(false),
  antGlaucoma: z.boolean().default(false),
  antCirugia: z.boolean().default(false),
  lentesDesde: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  antecedentesOtros: z.string().max(200).optional(),

  // Observaciones
  oftalmoscopia: z.string().max(500).optional(),
  queratometria: z.string().max(500).optional(),
  otros: z.string().max(500).optional(),

  // Mediciones (3 secciones × 2 ojos)
  lentesUsoOD: medicionSchema.optional(),
  lentesUsoOI: medicionSchema.optional(),
  retinoscopiaOD: medicionSchema.optional(),
  retinoscopiaOI: medicionSchema.optional(),
  recetaFinalOD: medicionSchema.optional(),
  recetaFinalOI: medicionSchema.optional(),
});

export const fichaUpdateSchema = fichaSchema.partial().omit({ pacienteId: true });

export type FichaInput = z.infer<typeof fichaSchema>;
export type FichaUpdateInput = z.infer<typeof fichaUpdateSchema>;
export type MedicionInput = z.infer<typeof medicionSchema>;
