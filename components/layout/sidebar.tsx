"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  CalendarClock,
  BarChart3,
  Settings,
  LogOut,
  ChevronsUpDown,
  Menu,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Empleados", href: "/employees", icon: Users },
  { name: "Turnos", href: "/shifts", icon: CalendarClock },
];

export function Sidebar() {
  const pathname = usePathname();

  const { signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Header Trigger */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg sm:text-xl text-white">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
          <span>StaffPlanner</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)} className="h-10 w-10">
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-200 ease-in-out flex flex-col md:sticky md:top-0 md:h-screen",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="h-14 sm:h-16 flex items-center px-4 sm:px-6 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg sm:text-xl text-white">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
            <span>StaffPlanner</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 sm:py-4 px-2 sm:px-3 space-y-1">
          {navItems.map((item) => {
            // consider subpaths active (e.g. /employees/123)
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 sm:gap-3 mb-1 text-sm sm:text-base",
                    isActive
                      ? "bg-indigo-700/20 text-indigo-300 hover:bg-indigo-700/30 hover:text-indigo-200 border-l-4 border-indigo-500"
                      : "text-gray-300 dark:text-gray-300 hover:text-white hover:bg-gray-800"
                  )}
                >
                  <item.icon className="h-4 w-4 text-current" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Footer / User Menu */}
        <div className="p-3 sm:p-4 border-t border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-auto flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg group"
              >
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-gray-700">
                    <AvatarImage src="/avatars/admin.svg" />
                    <AvatarFallback className="bg-indigo-900 text-indigo-200 text-xs sm:text-sm">AS</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-white group-hover:text-indigo-400 transition-colors truncate">Admin Staff</span>
                    <span className="text-xs text-gray-500 truncate">admin@staff.com</span>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-gray-200">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem className="focus:bg-gray-800 focus:text-white cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  );
}