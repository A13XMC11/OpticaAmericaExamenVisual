import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRol } from "@/modules/auth/rbac";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rol = getRol(user);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar rol={rol} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar email={user.email ?? ""} rol={rol} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
