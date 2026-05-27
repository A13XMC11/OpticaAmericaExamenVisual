"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, UserCog, Upload } from "lucide-react";
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
    <aside className="flex h-full w-60 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold text-blue-700">óptica</span>
        <span className="text-lg font-bold text-gray-800">américa</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visible.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-3">
        <p className="px-3 text-xs text-gray-400">desde 1982</p>
      </div>
    </aside>
  );
}
