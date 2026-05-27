import { z } from "zod";

export const pacienteSchema = z.object({
  cedula: z.string().min(5, "Cédula inválida").max(20),
  nombre: z.string().min(2, "Nombre requerido").max(100),
  apellido: z.string().min(2, "Apellido requerido").max(100),
  fechaNacimiento: z.coerce.date({ error: "Fecha de nacimiento requerida" }),
  telefono: z.string().max(20).optional().or(z.literal("")),
  direccion: z.string().max(200).optional().or(z.literal("")),
  ocupacion: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const pacienteUpdateSchema = pacienteSchema.partial();

export const buscarPacienteSchema = z.object({
  q: z.string().min(1).max(100),
});

export type PacienteInput = z.infer<typeof pacienteSchema>;
export type PacienteUpdateInput = z.infer<typeof pacienteUpdateSchema>;
