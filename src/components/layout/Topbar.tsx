"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";
import type { Rol } from "@/modules/auth/rbac";

const rolLabel: Record<string, string> = {
  ADMIN: "Administrador",
  OPTOMETRISTA: "Optometrista",
  RECEPCIONISTA: "Recepcionista",
};

const rolBadge: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary",
  OPTOMETRISTA: "bg-emerald-50 text-emerald-700",
  RECEPCIONISTA: "bg-amber-50 text-amber-700",
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

  const username = email.split("@")[0];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6">
      <GlobalSearch />

      <div className="flex items-center gap-3">
        {rol && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              rolBadge[rol] ?? "bg-muted text-muted-foreground"
            )}
          >
            {rolLabel[rol] ?? rol}
          </span>
        )}

        <div className="hidden flex-col items-end leading-tight sm:flex">
          <span className="text-sm font-medium text-foreground">{username}</span>
          <span className="text-[11px] text-muted-foreground">{email}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
