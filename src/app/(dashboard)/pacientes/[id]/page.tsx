import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findPacienteById } from "@/modules/pacientes/paciente.repository";
import { puedeCrearFicha } from "@/modules/auth/rbac";
import { FichaTimeline } from "@/components/fichas/FichaTimeline";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, ArrowLeft, Phone, Mail, MapPin, Briefcase } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PacienteDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const paciente = await findPacienteById(id);
  if (!paciente) notFound();

  const puedeCrear = user ? puedeCrearFicha(user) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ButtonLink href="/pacientes" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </ButtonLink>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {paciente.nombre} {paciente.apellido}
            </h1>
            <p className="font-mono text-sm text-gray-500">CC: {paciente.cedula}</p>
          </div>
        </div>
        <ButtonLink href={`/pacientes/${id}/editar`} variant="outline" size="sm">
          <Pencil className="mr-1 h-4 w-4" />
          Editar
        </ButtonLink>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Fecha de nacimiento</p>
            <p className="text-sm text-gray-900">
              {format(new Date(paciente.fechaNacimiento), "dd 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          {paciente.ocupacion && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Ocupación</p>
                <p className="text-sm text-gray-900">{paciente.ocupacion}</p>
              </div>
            </div>
          )}
          {paciente.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Teléfono</p>
                <p className="text-sm text-gray-900">{paciente.telefono}</p>
              </div>
            </div>
          )}
          {paciente.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{paciente.email}</p>
              </div>
            </div>
          )}
          {paciente.direccion && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-500">Dirección</p>
                <p className="text-sm text-gray-900">{paciente.direccion}</p>
              </div>
            </div>
          )}
        </div>

        {paciente.tags.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-1.5">
              {paciente.tags.map(({ tag }: { tag: { id: string; nombre: string; color: string } }) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color + "20", color: tag.color, borderColor: tag.color + "40" }}
                  className="border text-xs"
                >
                  {tag.nombre}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>

      <Separator />

      <FichaTimeline
        fichas={paciente.fichas.map((f) => ({
          ...f,
          fecha: f.fecha instanceof Date ? f.fecha.toISOString() : String(f.fecha),
          proximoControl: f.proximoControl instanceof Date ? f.proximoControl.toISOString() : f.proximoControl ? String(f.proximoControl) : null,
          createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : String(f.createdAt),
        }))}
        pacienteId={id}
        puedeCrear={puedeCrear}
      />
    </div>
  );
}
