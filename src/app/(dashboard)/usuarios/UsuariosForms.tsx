"use client";

import { useActionState } from "react";
import { UserPlus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUsuario, updateRolUsuario, deleteUsuario } from "./actions";

type ActionState = { error?: string; success?: boolean } | null;

// ── Role update inline form ──────────────────────────────────────
export function RolForm({ userId, currentRol }: { userId: string; currentRol: string | null }) {
  const [state, action, pending] = useActionState(updateRolUsuario, null);

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <div className="flex items-center gap-2">
        <select
          name="rol"
          defaultValue={currentRol ?? ""}
          className="rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ADMIN">Administrador</option>
          <option value="OPTOMETRISTA">Optometrista</option>
          <option value="RECEPCIONISTA">Recepcionista</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
        </button>
        {state?.success && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        {state?.error && <span title={state.error}><AlertCircle className="h-3.5 w-3.5 text-red-500" /></span>}
      </div>
    </form>
  );
}

// ── Delete button ────────────────────────────────────────────────
export function DeleteButton({ userId }: { userId: string }) {
  const [, action, pending] = useActionState(deleteUsuario, null);

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        title="Eliminar usuario"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </form>
  );
}

// ── Create user form ─────────────────────────────────────────────
export function CreateUsuarioForm() {
  const [state, action, pending] = useActionState(createUsuario, null);

  return (
    <form action={action} className="grid gap-4 p-6 sm:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="usuario@ejemplo.com"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rol">Rol</Label>
        <select
          id="rol"
          name="rol"
          required
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="RECEPCIONISTA">Recepcionista</option>
          <option value="OPTOMETRISTA">Optometrista</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      <div className="flex flex-col justify-end gap-1.5">
        <Button type="submit" className="w-full cursor-pointer" disabled={pending}>
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Crear usuario
        </Button>
        {state?.error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Usuario creado correctamente
          </p>
        )}
      </div>
    </form>
  );
}
