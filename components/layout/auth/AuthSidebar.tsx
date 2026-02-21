"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, User, Receipt } from "lucide-react";
import { AuraLogo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

const SidebarItem = ({ icon: Icon, label, active = false, href = "#", onClick }: { icon: any; label: string; active?: boolean; href?: string; onClick?: () => void }) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
      active 
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" 
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-blue-600 dark:text-blue-400" : "group-hover:text-slate-900 dark:group-hover:text-slate-100")} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const AuthSidebar = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleLogout = async () => {
    // Modo mock: llamar al endpoint de logout y navegar
    try {
      const resp = await fetch('/api/auth/logout', { method: 'POST' });
      if (!resp.ok) {
        toast.error('No se pudo cerrar sesión')
      } else {
        toast.success('Sesión cerrada')
      }
    } catch (e) {
      console.error('Logout (mock) failed', e);
      toast.error('No se pudo cerrar sesión')
    }
    router.push('/login');
    onClose?.();
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 mb-12 flex-shrink-0">
        <AuraLogo className="w-8 h-8 text-blue-500" />
        <span className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">EduManager</span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={pathname === '/dashboard'} href="/dashboard" onClick={handleNavClick} />
        <SidebarItem icon={Receipt} label="Reportes" active={pathname === '/reports'} href="/reports" onClick={handleNavClick} />
      </nav>

      {/* Mobile only footer */}
      <div className="lg:hidden space-y-2 pt-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <SidebarItem icon={User} label="Perfil" active={pathname === '/profile'} href="/profile" onClick={handleNavClick} />
        <SidebarItem icon={Settings} label="Configuración" active={pathname === '/settings'} href="/settings" onClick={handleNavClick} />
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </>
  );
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-72 auth-sidebar hidden lg:flex flex-col p-6 sticky top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent hover:scrollbar-thumb-zinc-700">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 w-72 h-screen auth-sidebar flex flex-col p-6 z-50 lg:hidden overflow-y-auto"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
