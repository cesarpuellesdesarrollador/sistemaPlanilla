import { NextResponse } from 'next/server'
import { getMasters, addMaster, updateMaster, deleteMaster, resetMasters } from '@/lib/mastersStore'
import { getAll } from '@/lib/employeesStore'

export async function GET() {
  const masters = getMasters()
  // collect usage counts from employees (dev in-memory)
  const all = getAll({ page: 1, pageSize: 100000 }).data
  const depCounts: Record<string, number> = {}
  const occCounts: Record<string, number> = {}
  const stateCounts: Record<string, number> = {}

  ;(masters.departments || []).forEach((d) => (depCounts[d] = 0))
  ;(masters.occupations || []).forEach((o) => (occCounts[o] = 0))
  ;(masters.states || []).forEach((s) => (stateCounts[s] = 0))

  all.forEach((e: any) => {
    if (e.departamento && typeof depCounts[e.departamento] === 'number') depCounts[e.departamento]++
    if (e.ocupacion && typeof occCounts[e.ocupacion] === 'number') occCounts[e.ocupacion]++
    if (e.estado && typeof stateCounts[e.estado] === 'number') stateCounts[e.estado]++
  })

  return NextResponse.json({ ...masters, usage: { departments: depCounts, occupations: occCounts, states: stateCounts } })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, value } = body
    if (!type || !value) return NextResponse.json({ error: 'type and value required' }, { status: 400 })
    const added = addMaster(type, value)
    if (!added) return NextResponse.json({ error: 'unable to add' }, { status: 400 })
    return NextResponse.json({ success: true, value: added })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { type, oldValue, newValue } = body
    if (!type || !oldValue || !newValue) return NextResponse.json({ error: 'type, oldValue and newValue required' }, { status: 400 })
    const updated = updateMaster(type, oldValue, newValue)
    if (!updated) return NextResponse.json({ error: 'not found or invalid' }, { status: 404 })
    return NextResponse.json({ success: true, value: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const value = url.searchParams.get('value')
    if (!type || !value) return NextResponse.json({ error: 'type and value required' }, { status: 400 })

    // Prevent deleting a master value that is currently used by any employee
    const all = getAll({ page: 1, pageSize: 100000 }).data
    let inUseCount = 0
    if (type === 'department') inUseCount = all.filter((e) => e.departamento === value).length
    if (type === 'occupation') inUseCount = all.filter((e) => e.ocupacion === value).length
    if (type === 'state') inUseCount = all.filter((e) => e.estado === value).length

    if (inUseCount > 0) {
      return NextResponse.json({ success: false, error: 'in-use', count: inUseCount }, { status: 409 })
    }

    const ok = deleteMaster(type as any, value)
    return NextResponse.json({ success: ok })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

// helper: reset (dev only) - POST /api/planning/masters?reset=1
export async function PATCH(request: Request) {
  const url = new URL(request.url)
  if (url.searchParams.get('reset') === '1') {
    resetMasters()
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'not supported' }, { status: 400 })
}
