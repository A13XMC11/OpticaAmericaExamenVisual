import { createClient } from "@/lib/supabase/server";
import { findPacientes, type PacienteRow } from "@/modules/pacientes/paciente.repository";
import { getRol } from "@/modules/auth/rbac";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { UserPlus, Upload, Users } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; page?: string; tagId?: string }>;
}

export default async function PacientesPage({ searchParams }: Props) {
  const { q, page: pageStr, tagId } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const rol = getRol(user);

  const { data: pacientes, total } = await findPacientes({ page, limit: 20, q, tagId });
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">{total} registros</p>
        </div>
        <div className="flex gap-2">
          {rol === "ADMIN" && (
            <ButtonLink href="/pacientes/importar" variant="outline" size="sm">
              <Upload className="mr-1 h-4 w-4" />
              Importar CSV
            </ButtonLink>
          )}
          <ButtonLink href="/pacientes/nuevo" size="sm">
            <UserPlus className="mr-1 h-4 w-4" />
            Nuevo paciente
          </ButtonLink>
        </div>
      </div>

      {/* Búsqueda */}
      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por cédula, nombre o apellido..." className="max-w-sm" />
        <Button type="submit" variant="outline">Buscar</Button>
        {q && (
          <ButtonLink href="/pacientes" variant="ghost">Limpiar</ButtonLink>
        )}
      </form>

      {/* Lista */}
      {pacientes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-gray-400">
          <Users className="h-10 w-10" />
          <p>{q ? `Sin resultados para "${q}"` : "No hay pacientes registrados"}</p>
          <ButtonLink href="/pacientes/nuevo" size="sm">Crear primer paciente</ButtonLink>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Cédula</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Teléfono</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Fichas</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Etiquetas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {pacientes.map((p: PacienteRow) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.cedula}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre} {p.apellido}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.telefono ?? "—"}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <Badge variant="outline">{p._count.fichas}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map(({ tag }) => (
                        <Badge key={tag.id} style={{ backgroundColor: tag.color + "20", color: tag.color }} className="text-xs">
                          {tag.nombre}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ButtonLink href={`/pacientes/${p.id}`} variant="ghost" size="sm">Ver</ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <ButtonLink href={`/pacientes?page=${page - 1}${q ? `&q=${q}` : ""}`} variant="outline" size="sm">
              Anterior
            </ButtonLink>
          )}
          <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <ButtonLink href={`/pacientes?page=${page + 1}${q ? `&q=${q}` : ""}`} variant="outline" size="sm">
              Siguiente
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  );
}
