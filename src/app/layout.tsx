import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Óptica América — Sistema de Gestión",
  description: "Sistema de gestión de pacientes y fichas de examen visual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="h-full bg-gray-50 font-sans">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
