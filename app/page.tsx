"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BarChart, Users, CalendarClock } from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Button } from "@/components/ui/button";

const features = [
  {
    name: "Planificación Centralizada",
    description: "Visualiza y gestiona el calendario anual de todo tu personal en un único lugar.",
    icon: CalendarClock,
  },
  {
    name: "Gestión de Trabajadores",
    description: "Mantén un registro detallado de cada trabajador, incluyendo fechas clave y permisos.",
    icon: Users,
  },
  {
    name: "Filtros y Reportes",
    description: "Filtra por departamento, ocupación o estado para obtener la información que necesitas al instante.",
    icon: BarChart,
  },
];

export default function LandingPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-gray-950 text-white font-sans">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="text-indigo-500 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="font-bold text-lg sm:text-xl">StaffPlanner</span>
            </div>
            <Link href="/login">
              <Button variant="outline" className="bg-transparent border-gray-700 hover:bg-gray-800 text-sm sm:text-base px-3 sm:px-4">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-grid-gray-800/[0.2] [mask-image:linear-gradient(to_bottom,white_5%,transparent_100%)]"
            style={{
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative max-w-4xl mx-auto pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 text-center">
            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 py-6 sm:py-8 md:py-10"
            >
              Optimiza la Gestión de tu Personal
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-gray-400 px-4"
            >
              Transforma tu hoja de cálculo en una aplicación potente e intuitiva. Controla la planificación, fechas y permisos de trabajo de todo tu equipo de forma eficiente.
            </m.p>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 sm:mt-10 flex justify-center gap-4"
            >
              <Link href="/login">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 text-sm sm:text-base">
                  Acceder al Sistema <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </m.div>
          </div>
        </main>

        {/* Features Section */}
        <section className="py-12 sm:py-24 bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, i) => (
                <m.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 sm:p-8 bg-gray-900 border border-gray-800 rounded-2xl"
                >
                  <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-500 mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">{feature.name}</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-400">{feature.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 sm:py-8 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500">
            <p className="text-sm sm:text-base">&copy; {new Date().getFullYear()} StaffPlanner. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}