import Link from "next/link";
import { LayoutDashboard, Gavel, Plus, Compass } from "lucide-react";
import { AuraLogo } from "@/components/logo";

export const AdminSidebar = () => {
  return (
    <aside className="w-20 lg:w-64 bg-black/50 border-r border-white/5 hidden md:flex flex-col p-4 sticky top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent hover:scrollbar-thumb-zinc-700">
      <div className="flex items-center gap-3 mb-12 pl-2 flex-shrink-0">
        <AuraLogo className="w-8 h-8 text-amber-500" />
        <span className="text-xl font-bold tracking-tighter hidden lg:block">AURA Admin</span>
      </div>
      <nav className="space-y-2 flex-1 overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-colors font-medium">
          <LayoutDashboard size={20} /> <span className="hidden lg:block">Dashboard</span>
        </Link>
      </nav>
    </aside>
  );
};
