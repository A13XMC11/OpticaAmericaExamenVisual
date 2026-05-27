import { createClient } from "@/lib/supabase/server";
import { CedulaAutocomplete } from "@/components/pacientes/CedulaAutocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Clock, CalendarCheck, MessageCircle, Search } from "lucide-react";
import { findProximosControles } from "@/modules/fichas/ficha.repository";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

function diasRestantes(fecha: string | null): number {
  if (!fecha) return Infinity;
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000);
}

function urgencyClass(dias: number): string {
  if (dias <= 0) return "border-red-200 bg-red-50";
  if (dias <= 7) return "border-orange-200 bg-orange-50";
  return "border-border bg-white";
}

function urgencyDateClass(dias: number): string {
  if (dias <= 0) return "text-red-600";
  if (dias <= 7) return "text-orange-600";
  return "text-amber-600";
}

function urgencyDotClass(dias: number): string {
  if (dias <= 0) return "bg-red-500";
  if (dias <= 7) return "bg-orange-400";
  return "bg-amber-400";
}

function whatsappUrl(telefono: string | null, nombre: string, fecha: string | null): string | null {
  if (!telefono) return null;
  const clean = telefono.replace(/\D/g, "");
  const intl = clean.startsWith("0") ? `593${clean.slice(1)}` : clean.startsWith("593") ? clean : `593${clean}`;
  const fechaStr = fecha ? format(new Date(fecha), "dd/MM/yyyy") : "";
  const msg = encodeURIComponent(
    `Hola ${nombre}, le recordamos que su próximo control visual está programado para el ${fechaStr}. Lo esperamos en Óptica América.`
  );
  return `https://wa.me/${intl}?text=${msg}`;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

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

const stats = [
  {
    key: "totalPacientes",
    label: "Total pacientes",
    icon: Users,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    key: "fichasHoy",
    label: "Fichas hoy",
    icon: FileText,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    key: "fichasSemana",
    label: "Esta semana",
    icon: Clock,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    key: "proximosControles",
    label: "Controles próximos",
    icon: CalendarCheck,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
] as const;

export default async function DashboardPage() {
  const { totalPacientes, fichasHoy, fichasSemana, proximosControles } = await getDashboardStats();

  const values: Record<string, number> = {
    totalPacientes,
    fichasHoy,
    fichasSemana,
    proximosControles: proximosControles.length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{timeGreeting()}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground capitalize">
          {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
          <Card key={key} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-2xl font-bold text-foreground">{values[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Búsqueda inteligente */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Buscar paciente</h2>
        </div>
        <CedulaAutocomplete />
      </div>

      {/* Controles pendientes */}
      {proximosControles.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                <CalendarCheck className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Controles próximos</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {proximosControles.length} en 30 días
            </span>
          </div>

          <div className="divide-y divide-border">
            {proximosControles.map((c) => {
              const dias = diasRestantes(c.proximoControl);
              const wa = whatsappUrl(c.paciente.telefono, c.paciente.nombre, c.proximoControl);
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-6 py-3.5 transition-colors ${urgencyClass(dias)}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${urgencyDotClass(dias)}`} />
                    <Link href={`/pacientes/${c.paciente.id}`} className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.paciente.nombre} {c.paciente.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">CC: {c.paciente.cedula}</p>
                    </Link>
                  </div>

                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${urgencyDateClass(dias)}`}>
                        {c.proximoControl ? format(new Date(c.proximoControl), "dd/MM/yyyy") : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dias <= 0 ? "Vencido" : `${dias} día${dias === 1 ? "" : "s"}`}
                      </p>
                    </div>

                    {wa ? (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar recordatorio por WhatsApp"
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Sin teléfono</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
