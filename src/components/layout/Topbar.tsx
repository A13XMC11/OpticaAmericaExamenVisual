"use client";

import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./GlobalSearch";
import type { Rol } from "@/modules/auth/rbac";

const rolLabel: Record<string, string> = {
  ADMIN: "Administrador",
  OPTOMETRISTA: "Optometrista",
  RECEPCIONISTA: "Recepcionista",
};

interface TopbarProps {
  email: string;
  rol: Rol | null;
}

export function Topbar({ email, rol }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <GlobalSearch />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{email}</span>
          {rol && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {rolLabel[rol] ?? rol}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
