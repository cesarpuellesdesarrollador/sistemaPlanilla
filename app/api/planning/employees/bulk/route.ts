import { NextResponse } from 'next/server'
import { bulkUpdate } from '@/lib/employeesStore'
import { getMasters } from '@/lib/mastersStore'
import { validateEmployeePayload } from '@/lib/validators'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ids, patch } = body
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'ids required' }, { status: 400 })
    if (!patch || typeof patch !== 'object') return NextResponse.json({ error: 'patch required' }, { status: 400 })

    // basic validation of patch against masters and date formats
    const masters = getMasters()
    if (patch.departamento && !masters.departments.includes(patch.departamento)) return NextResponse.json({ error: `Departamento desconocido: ${patch.departamento}` }, { status: 400 })
    if (patch.ocupacion && !masters.occupations.includes(patch.ocupacion)) return NextResponse.json({ error: `Ocupación desconocida: ${patch.ocupacion}` }, { status: 400 })
    if (patch.estado && !masters.states.includes(patch.estado)) return NextResponse.json({ error: `Estado desconocido: ${patch.estado}` }, { status: 400 })

    // validate dates via validator (partial)
    const partialCheck = validateEmployeePayload(patch, { partial: true })
    if (!partialCheck.valid) return NextResponse.json({ error: 'Validation failed', details: partialCheck.errors }, { status: 400 })

    const updated = bulkUpdate(ids.map((i: any) => Number(i)), patch)
    return NextResponse.json({ success: true, updatedCount: updated.length, updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}