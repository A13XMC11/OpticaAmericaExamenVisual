"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRol } from "@/modules/auth/rbac";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roles = ["ADMIN", "OPTOMETRISTA", "RECEPCIONISTA"] as const;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rol: z.enum(roles),
});

const updateRolSchema = z.object({
  userId: z.string().uuid(),
  rol: z.enum(roles),
});

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || getRol(user) !== "ADMIN") throw new Error("Sin permisos");
}

export async function createUsuario(_prev: unknown, formData: FormData) {
  await assertAdmin();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rol: formData.get("rol"),
  });

  if (!parsed.success) return { error: "Datos inválidos" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    app_metadata: { role: parsed.data.rol },
    email_confirm: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { success: true };
}

export async function updateRolUsuario(_prev: unknown, formData: FormData) {
  await assertAdmin();

  const parsed = updateRolSchema.safeParse({
    userId: formData.get("userId"),
    rol: formData.get("rol"),
  });

  if (!parsed.success) return { error: "Datos inválidos" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    app_metadata: { role: parsed.data.rol },
  });

  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { success: true };
}

export async function deleteUsuario(_prev: unknown, formData: FormData) {
  await assertAdmin();

  const userId = formData.get("userId") as string;
  if (!userId) return { error: "ID inválido" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { success: true };
}
