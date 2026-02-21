"use client";

import { ReactNode, useState, useEffect } from "react";
import { AuthHeader } from "./AuthHeader";
import { AuthSidebar } from "./AuthSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/useAuthStore";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar spinner solo durante mount inicial
  if (!mounted) {
    return (
      <div className="h-screen auth-layout flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-brand-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar spinner de cierre de sesión
  if (!user) {
    return (
      <div className="h-screen auth-layout flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-brand-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen auth-layout text-slate-900 dark:text-slate-100 flex font-sans selection:bg-amber-500 selection:text-black overflow-hidden">
      <AuthSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex-shrink-0 auth-header px-4 sm:px-6 lg:px-10 py-4">
          <AuthHeader onMenuClick={() => setMobileMenuOpen(true)} />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 auth-main p-4 sm:p-6 lg:p-10 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
