import { NextResponse } from 'next/server'
import { getAll, createEmployee, updateEmployee, deleteEmployee, getById } from '@/lib/employeesStore'
import { validateEmployeePayload } from '@/lib/validators'
export async function GET(request: Request) {
  const url = new URL(request.url)
  const departamento = url.searchParams.get('departamento') || undefined
  const ocupacion = url.searchParams.get('ocupacion') || undefined
  const estado = url.searchParams.get('estado') || undefined
  const search = url.searchParams.get('search') || undefined
  const page = Number(url.searchParams.get('page') || '1')
  const pageSize = Number(url.searchParams.get('pageSize') || '25')
  const id = url.searchParams.get('id')

  if (id) {
    const eid = Number(id)
    const found = getById(eid)
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(found)
  }

  const result = getAll({ departamento, ocupacion, estado, search, page, pageSize })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = validateEmployeePayload(body)
    if (!validated.valid) {
      return NextResponse.json({ error: 'Validation failed', details: validated.errors }, { status: 400 })
    }
    const created = createEmployee(validated.normalized || body)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid payload' }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const updated = updateEmployee(id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid payload' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const idParam = url.searchParams.get('id')
    if (idParam) {
      const ok = deleteEmployee(Number(idParam))
      return NextResponse.json({ success: ok })
    }
    const body = await request.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const ok = deleteEmployee(id)
    return NextResponse.json({ success: ok })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
