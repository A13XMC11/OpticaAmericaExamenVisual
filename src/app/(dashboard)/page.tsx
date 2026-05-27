import { createClient } from "@/lib/supabase/server";
import { CedulaAutocomplete } from "@/components/pacientes/CedulaAutocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Clock, CalendarCheck } from "lucide-react";
import { findProximosControles } from "@/modules/fichas/ficha.repository";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

async function getDashboardStats() {
  const supabase = await createClient();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const [totalPacientes, fichasHoy, fichasSemana, proximosControles] = await Promise.all([
    supabase
      .from("Paciente")
      .select("id", { count: "exact", head: true })
      .is("deletedAt", null),
    supabase
      .from("FichaExamen")
      .select("id", { count: "exact", head: true })
      .gte("createdAt", hoy.toISOString())
      .lt("createdAt", manana.toISOString()),
    supabase
      .from("FichaExamen")
      .select("id", { count: "exact", head: true })
      .gte("createdAt", new Date(Date.now() - 7 * 86400000).toISOString()),
    findProximosControles(30),
  ]);

  if (totalPacientes.error) throw new Error(totalPacientes.error.message);
  if (fichasHoy.error) throw new Error(fichasHoy.error.message);
  if (fichasSemana.error) throw new Error(fichasSemana.error.message);

  return {
    totalPacientes: totalPacientes.count ?? 0,
    fichasHoy: fichasHoy.count ?? 0,
    fichasSemana: fichasSemana.count ?? 0,
    proximosControles,
  };
}

export default async function DashboardPage() {
  const { totalPacientes, fichasHoy, fichasSemana, proximosControles } = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Búsqueda inteligente */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Buscar paciente</h2>
        <CedulaAutocomplete />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Total pacientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalPacientes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Fichas hoy</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fichasHoy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Esta semana</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fichasSemana}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">Controles próximos</CardTitle>
            <CalendarCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{proximosControles.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles pendientes */}
      {proximosControles.length > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Controles próximos (30 días)
          </h2>
          <div className="space-y-2">
            {proximosControles.map((c) => (
              <Link
                key={c.id}
                href={`/pacientes/${c.paciente.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {c.paciente.nombre} {c.paciente.apellido}
                  </p>
                  <p className="text-xs text-gray-500">Cédula: {c.paciente.cedula}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-600">
                    {c.proximoControl
                      ? format(new Date(c.proximoControl), "dd/MM/yyyy")
                      : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
