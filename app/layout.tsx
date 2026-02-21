import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NoConnection, ErrorBoundary } from "@/components/feedback";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StaffPlanner - Gestión de Personal",
  description: "Sistema integral para la planificación y gestión de personal, turnos y departamentos.",
  keywords: ["gestión de personal", "planificación", "rrhh", "turnos", "empleados", "staff planner"],
  authors: [{ name: "StaffPlanner" }],
  openGraph: {
    title: "StaffPlanner - Gestión de Personal",
    description: "Sistema integral para la planificación y gestión de personal.",
    url: "https://staffplanner.app",
    siteName: "StaffPlanner",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StaffPlanner - Gestión de Personal",
    description: "Optimiza la gestión de tu equipo con StaffPlanner.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body
        className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ErrorBoundary>
            <AuthProvider>
              <NoConnection />
              <Toaster position="top-right" theme="dark" />
              {children}
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
