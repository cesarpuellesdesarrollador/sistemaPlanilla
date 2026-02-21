"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"
import { useAuth } from '@/hooks/useAuth'

export default function NotFound() {
  const { user } = useAuth()
  const dest = user ? '/dashboard' : '/'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white font-sans p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="flex justify-center">
          <div className="p-4 bg-gray-900 rounded-full border border-gray-800">
            <FileQuestion className="h-12 w-12 text-indigo-500" />
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Página no encontrada</h1>
        <p className="text-gray-400 text-lg">
          Lo sentimos, no hemos podido encontrar la página que estás buscando. Puede que haya sido movida o eliminada.
        </p>
        <div className="pt-4">
          <Link href={dest}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}