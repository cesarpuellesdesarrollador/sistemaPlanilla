"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Worker } from "@/lib/data"

import { formatDateDMY } from '@/lib/utils'

const formatDate = (date: Date | string | null) => {
    if (!date) return <span className="text-gray-500">N/A</span>;
    const s = formatDateDMY(date)
    return <span>{s}</span>
}

export const columns: ColumnDef<Worker>[] = [
  {
    accessorKey: "departamento",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-gray-700"
        >
          Departamento
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "fullName",
    header: "Nombre",
    cell: ({ row }) => {
      const v = row.getValue('fullName') as string | undefined
      return v ? <span className="font-medium">{v}</span> : <span className="text-gray-400">—</span>
    }
  },
  {
    accessorKey: "ocupacion",
    header: "Ocupación",
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
            const estado = row.getValue("estado") as string;
        const variant = estado === 'activo' ? 'default' : 'destructive';
        const label = estado === 'no activo' ? 'Inactivo' : (estado === 'activo' ? 'Activo' : estado)
        return <Badge variant={variant} className={`${variant === 'default' ? 'bg-green-500 text-green-950' : 'bg-red-500 text-red-950'}`}>{label}</Badge>
    }
  },
  {
    accessorKey: "fechaLlegadaPlanificada",
    header: "Llegada Planificada",
    cell: ({ row }) => formatDate(row.getValue("fechaLlegadaPlanificada"))
  },
  {
    accessorKey: "fechaLlegadaReal",
    header: "Llegada Real",
    cell: ({ row }) => formatDate(row.getValue("fechaLlegadaReal"))
  },
  {
    accessorKey: "fechaSalidaPlanificada",
    header: "Salida Planificada",
    cell: ({ row }) => formatDate(row.getValue("fechaSalidaPlanificada"))
  },
  {
    accessorKey: "fechaSalidaReal",
    header: "Salida Real",
    cell: ({ row }) => formatDate(row.getValue("fechaSalidaReal"))
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const worker = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-700">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(worker.id.toString())}
              className="focus:bg-gray-700"
            >
              Copiar ID de trabajador
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700"/>
            <DropdownMenuItem className="focus:bg-gray-700">Ver detalles</DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-gray-700">Editar trabajador</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]