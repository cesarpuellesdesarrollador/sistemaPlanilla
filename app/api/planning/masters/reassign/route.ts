import { NextResponse } from 'next/server'
import { getAll, bulkUpdate } from '@/lib/employeesStore'
import { getMasters, addMaster, deleteMaster } from '@/lib/mastersStore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, from, to, removeOld } = body
    if (!type || !from || !to) return NextResponse.json({ error: 'type, from and to required' }, { status: 400 })
    if (!['department', 'occupation', 'state'].includes(type)) return NextResponse.json({ error: 'invalid type' }, { status: 400 })

    // find employees using `from`
    const filter: any = { page: 1, pageSize: 100000 }
    if (type === 'department') filter.departamento = from
    if (type === 'occupation') filter.ocupacion = from
    if (type === 'state') filter.estado = from

    const list = getAll(filter).data
    const ids = list.map((e: any) => e.id)

    // ensure `to` exists in masters (add if missing)
    const masters = getMasters()
    const targetExists = type === 'department' ? masters.departments.includes(to) : type === 'occupation' ? masters.occupations.includes(to) : masters.states.includes(to)
    let addedTarget = false
    if (!targetExists) {
      addMaster(type as any, to)
      addedTarget = true
    }

    // perform bulk update
    let updatedCount = 0
    if (ids.length > 0) {
      const patch: any = {}
      if (type === 'department') patch.departamento = to
      if (type === 'occupation') patch.ocupacion = to
      if (type === 'state') patch.estado = to
      const updated = bulkUpdate(ids, patch)
      updatedCount = updated.length
    }

    // optionally delete the old master value
    let deleted = false
    if (removeOld) {
      // only delete if no remaining usage
      const remaining = getAll(filter).data || []
      if (remaining.length === 0) {
        deleted = deleteMaster(type as any, from)
      } else {
        // should not happen because we just reassigned, but guard anyway
        deleted = false
      }
    }

    return NextResponse.json({ success: true, updatedCount, addedTarget, deleted })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
