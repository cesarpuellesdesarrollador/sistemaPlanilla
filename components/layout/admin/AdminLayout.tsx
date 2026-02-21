"use client";

import { ReactNode, useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { LoadingSpinner } from "@/components/feedback";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { loading, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar spinner durante mount inicial o cuando está cargando
  if (!mounted || loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Si ya montó y no está cargando pero no hay usuario, mostrar spinner
  // (esto cubre el caso de cierre de sesión)
  if (!user) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex font-sans selection:bg-amber-500 selection:text-black overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col h-full">
        <header className="flex-shrink-0 bg-zinc-950 border-b border-white/5 px-6 lg:px-10 py-4">
          <AdminHeader />
        </header>

        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
