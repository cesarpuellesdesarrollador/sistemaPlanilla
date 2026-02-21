"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import * as Avatar from "@radix-ui/react-avatar";
import { User, LogOut, Settings, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const { userName: storeUserName, userRole, setUserProfile } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // En modo mock usamos los metadatos del usuario y el store
    if (user && user.id !== lastUserId.current) {
      lastUserId.current = user.id;
      setProfileLoading(true);

      const role = user.user_metadata?.role || 'ENCARGADO_PLANTEL';
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
      setIsAdmin(role === 'ADMIN');
      setUserName(name);
      setUserProfile(name, role);

      setProfileLoading(false);
    } else if (!user) {
      lastUserId.current = null;
    }
  }, [user?.id, user?.email, setUserProfile]);

  // Escuchar cambios desde Zustand store
  useEffect(() => {
    if (storeUserName && storeUserName !== userName) {
      setUserName(storeUserName);
      setIsAdmin(userRole === 'ADMIN');
    }
  }, [storeUserName, userRole, userName]);

  const handleToggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSignOut = useCallback(() => {
    setIsOpen(false);
    toast.info('Cerrando sesión...');
    signOut();
  }, [signOut]);

  // Cerrar menú cuando se cambia de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsOpen(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const initials = useMemo(() => {
    return userName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || user?.email?.charAt(0).toUpperCase() || 'U';
  }, [userName, user?.email]);

  if (loading || !user || profileLoading) {
    return (
      <div className="flex items-center gap-3 w-[280px]">
        <div className="h-8 w-8 bg-zinc-800 rounded-full animate-pulse flex-shrink-0" />
        <div className="hidden sm:block space-y-1 flex-1 min-w-0">
          <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="h-5 w-5 bg-zinc-800 rounded animate-pulse flex-shrink-0" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggleMenu}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity group cursor-pointer w-[280px]"
      >
        <Avatar.Root className="inline-flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full bg-zinc-800 border border-white/10 flex-shrink-0">
          <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-blue-500 text-sm font-bold text-white">
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
        <div className="hidden sm:block text-left flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{userName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
        </div>
        <MoreVertical size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseMenu}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-white/10">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
            </div>
            <div className="py-2">
              <Link
                href="/profile"
                onClick={handleCloseMenu}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              >
                <User size={16} />
                Mi Perfil
              </Link>
              <Link
                href="/settings"
                onClick={handleCloseMenu}
                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
              >
                <Settings size={16} />
                Configuración
              </Link>
            </div>
            <div className="border-t border-white/10 py-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors w-full cursor-pointer"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
