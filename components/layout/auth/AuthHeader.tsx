"use client";

import { UserMenu } from "@/components/layout/user-menu";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

export function AuthHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    return 'Dashboard';
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
        
        <div className="flex items-center gap-6">
          <div className="h-8 w-8 bg-zinc-800 rounded-full animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-zinc-800 rounded-full animate-pulse" />
            <div className="hidden sm:block space-y-1">
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="h-5 w-5 bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-1 text-slate-900 dark:text-white">{getPageTitle()}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Gestión y control académico</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden lg:block">
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
