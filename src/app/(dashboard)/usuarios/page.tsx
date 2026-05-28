import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRol } from "@/modules/auth/rbac";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserCog, UserPlus, Shield, Eye, ClipboardList } from "lucide-react";
import { RolForm, DeleteButton, CreateUsuarioForm } from "./UsuariosForms";

const rolLabel: Record<string, string> = {
  ADMIN: "Administrador",
  OPTOMETRISTA: "Optometrista",
  RECEPCIONISTA: "Recepcionista",
};

const rolBadge: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/20",
  OPTOMETRISTA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RECEPCIONISTA: "bg-amber-50 text-amber-700 border-amber-200",
};

const rolIcon: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="h-3 w-3" />,
  OPTOMETRISTA: <Eye className="h-3 w-3" />,
  RECEPCIONISTA: <ClipboardList className="h-3 w-3" />,
};

export default async function UsuariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || getRol(user) !== "ADMIN") redirect("/");

  const admin = createAdminClient();
  const { data: { users }, error } = await admin.auth.admin.listUsers();

  if (error) throw new Error(error.message);

  const activeUsers = users.filter((u) => !u.banned_until);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {activeUsers.length} usuario{activeUsers.length !== 1 ? "s" : ""} registrado{activeUsers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <UserCog className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Equipo</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Rol actual</th>
              <th className="px-6 py-3 text-left hidden md:table-cell">Creado</th>
              <th className="px-6 py-3 text-left hidden lg:table-cell">Último acceso</th>
              <th className="px-6 py-3 text-left">Cambiar rol</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activeUsers.map((u) => {
              const rol = (u.app_metadata?.role as string) ?? null;
              const isMe = u.id === user.id;
              return (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {u.email?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.email}</p>
                        {isMe && <p className="text-[10px] text-muted-foreground">Tú</p>}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3.5">
                    {rol ? (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${rolBadge[rol] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {rolIcon[rol]}
                        {rolLabel[rol] ?? rol}
                      </span>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Sin rol</span>
                    )}
                  </td>

                  <td className="px-6 py-3.5 text-muted-foreground hidden md:table-cell">
                    {u.created_at
                      ? format(new Date(u.created_at), "dd/MM/yyyy", { locale: es })
                      : "—"}
                  </td>

                  <td className="px-6 py-3.5 text-muted-foreground hidden lg:table-cell">
                    {u.last_sign_in_at
                      ? format(new Date(u.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: es })
                      : "Nunca"}
                  </td>

                  <td className="px-6 py-3.5">
                    <RolForm userId={u.id} currentRol={rol} />
                  </td>

                  <td className="px-6 py-3.5 text-right">
                    {!isMe && <DeleteButton userId={u.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Crear usuario */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
            <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Agregar usuario</h2>
        </div>
        <CreateUsuarioForm />
      </div>
    </div>
  );
}
