"use client";

import { NotificationIcon } from "@/components/icon";
import { UserMenu } from "@/components/layout/user-menu";
import { useAuth } from "@/hooks/useAuth";

export function AdminHeader() {
  const { user, loading } = useAuth();
  const userName = user?.email?.split('@')[0] || '';
  const displayName = userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : '';

  if (loading || !user) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-zinc-800 rounded-lg animate-pulse" />
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {displayName}.</h1>
        <p className="text-zinc-400 text-sm">Panel de administración</p>
      </div>
      
      <div className="flex items-center gap-6">
        <NotificationIcon hasNotifications={true} />
        <UserMenu />
      </div>
    </div>
  );
}
