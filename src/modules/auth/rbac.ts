import { User } from "@supabase/supabase-js";

export type Rol = "ADMIN" | "OPTOMETRISTA" | "RECEPCIONISTA";

export function getRol(user: User): Rol | null {
  return (user.user_metadata?.role as Rol) ?? null;
}

export function esAdmin(user: User): boolean {
  return getRol(user) === "ADMIN";
}

export function puedeCrearFicha(user: User): boolean {
  const rol = getRol(user);
  return rol === "ADMIN" || rol === "OPTOMETRISTA";
}

export function puedeGestionarPacientes(user: User): boolean {
  return getRol(user) !== null;
}

export function puedeEliminarPaciente(user: User): boolean {
  return esAdmin(user);
}

export function puedeImportar(user: User): boolean {
  return esAdmin(user);
}

export function puedeGestionarUsuarios(user: User): boolean {
  return esAdmin(user);
}
