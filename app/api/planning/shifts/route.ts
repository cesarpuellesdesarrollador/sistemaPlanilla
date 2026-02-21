import { NextResponse } from 'next/server'
import { getAll } from '@/lib/employeesStore'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const departamento = url.searchParams.get('departamento') || undefined
  const ocupacion = url.searchParams.get('ocupacion') || undefined
  const estado = url.searchParams.get('estado') || undefined
  const page = Number(url.searchParams.get('page') || '1')
  const pageSize = Number(url.searchParams.get('pageSize') || '100')

  const result = getAll({ departamento, ocupacion, estado, page, pageSize })

  // Map dates to ISO strings for the client timeline
  const data = (result.data || []).map((w) => ({
    id: w.id,
    departamento: w.departamento,
    ocupacion: w.ocupacion,
    estado: w.estado,
    fechaLlegadaPlanificada: w.fechaLlegadaPlanificada?.toISOString() || null,
    fechaLlegadaReal: w.fechaLlegadaReal?.toISOString() || null,
    fechaSalidaPlanificada: w.fechaSalidaPlanificada?.toISOString() || null,
    fechaSalidaReal: w.fechaSalidaReal?.toISOString() || null,
    inicioPermisoTrabajo: w.inicioPermisoTrabajo?.toISOString() || null,
    finPermisoTrabajo: w.finPermisoTrabajo?.toISOString() || null,
  }))

  return NextResponse.json({ data, total: result.total })
}