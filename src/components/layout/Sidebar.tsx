"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, UserCog, Upload, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Rol } from "@/modules/auth/rbac";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OPTOMETRISTA", "RECEPCIONISTA"] },
  { href: "/pacientes", label: "Pacientes", icon: Users, roles: ["ADMIN", "OPTOMETRISTA", "RECEPCIONISTA"] },
  { href: "/pacientes/importar", label: "Importar CSV", icon: Upload, roles: ["ADMIN"] },
  { href: "/usuarios", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
];

interface SidebarProps {
  rol: Rol | null;
}

export function Sidebar({ rol }: SidebarProps) {
  const pathname = usePathname();

  const visible = navItems.filter((item) =>
    rol ? item.roles.includes(rol) : false
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-white">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
          <Eye className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex min-w-0 flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">
            <span className="text-primary">óptica</span>
            <span className="text-foreground">américa</span>
          </span>
          <span className="text-[10px] text-muted-foreground">Sistema de Gestión</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Menú
        </p>
        {visible.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-3">
        <p className="text-[10px] text-muted-foreground">desde 1982 · v1.0</p>
      </div>
    </aside>
  );
}
