"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RecuperarContrasenaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });

    if (authError) {
      setError("No se pudo enviar el email. Verifica la dirección.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-blue-700">óptica</span>
            <span className="text-gray-800">américa</span>
          </h1>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-5">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <p className="font-semibold text-gray-800">Email enviado</p>
                <p className="mt-1 text-sm text-gray-500">
                  Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
                </p>
              </div>
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Recuperar contraseña</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@opticaamerica.com"
                  required
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar enlace
              </Button>

              <p className="text-center text-sm">
                <Link href="/login" className="text-blue-600 hover:underline">
                  ← Volver al login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
