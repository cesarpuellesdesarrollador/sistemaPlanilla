import fs from 'fs'
import path from 'path'
import xlsx from 'node-xlsx'
import { Worker, mockData } from './data'
import { validateEmployeePayload } from './validators'

export type EmployeeFilters = {
  departamento?: string
  ocupacion?: string
  estado?: string
  search?: string
  page?: number
  pageSize?: number
}

const EXCEL_DB_PATH = process.env.EXCEL_DB_PATH || path.join(process.cwd(), 'data', 'data.xlsx')
const EXCEL_ENABLED = process.env.EXCEL_DB_ENABLED !== 'false'

function readEmployeesFromExcel(): Worker[] {
  if (!EXCEL_ENABLED) return mockData.map((w) => ({ ...w }))
  if (!fs.existsSync(EXCEL_DB_PATH)) return mockData.map((w) => ({ ...w }))
  try {
    const buf = fs.readFileSync(EXCEL_DB_PATH)
    const sheets = xlsx.parse(buf)
    if (!sheets || sheets.length === 0) return mockData.map((w) => ({ ...w }))

    const sheet = sheets[0]
    const allRows = sheet.data || []
    if (allRows.length <= 1) return []
    const header = (allRows[0] || []).map((h: any) => String(h || '').trim())
    const rows = (allRows.slice(1) as any[][])

    const parsed: Worker[] = rows.map((r, idx) => {
      const obj: any = {}
      header.forEach((h, i) => {
        obj[h] = r[i] == null ? '' : String(r[i]).trim()
      })

      // normalize with validators to parse dates / names consistently
      const v = validateEmployeePayload(obj, { partial: true })
      const norm = v.normalized || obj

      const parseIsoOrDMY = (val: any) => {
        if (val == null || val === '') return null
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return new Date(val)
        const m = String(val).match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/)
        if (m) return new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00.000Z`)
        if (val instanceof Date) return val
        const d = new Date(val)
        return isNaN(d.getTime()) ? null : d
      }

      const id = Number(obj.id || norm.id) || (idx + 1)
      const w: Worker = {
        id,
        departamento: norm.departamento || obj.departamento || 'Administración',
        ocupacion: norm.ocupacion || obj.ocupacion || 'Empleado/a',
        estado: (norm.estado as any) || 'activo',
        fullName: norm.fullName || obj.fullName || `${norm.firstName || obj.firstName || 'Empleado'} ${norm.lastName || obj.lastName || ''}`.trim(),
        firstName: norm.firstName || obj.firstName || undefined,
        lastName: norm.lastName || obj.lastName || undefined,
        employeeNumber: norm.employeeNumber ?? (obj.employeeNumber || null),
        email: norm.email ?? (obj.email || null),
        fechaLlegadaPlanificada: parseIsoOrDMY(norm.fechaLlegadaPlanificada || obj.fechaLlegadaPlanificada) || new Date(),
        fechaLlegadaReal: parseIsoOrDMY(norm.fechaLlegadaReal || obj.fechaLlegadaReal) || null,
        fechaSalidaPlanificada: parseIsoOrDMY(norm.fechaSalidaPlanificada || obj.fechaSalidaPlanificada) || new Date(),
        fechaSalidaReal: parseIsoOrDMY(norm.fechaSalidaReal || obj.fechaSalidaReal) || null,
        inicioPermisoTrabajo: parseIsoOrDMY(norm.inicioPermisoTrabajo || obj.inicioPermisoTrabajo) || new Date(),
        finPermisoTrabajo: parseIsoOrDMY(norm.finPermisoTrabajo || obj.finPermisoTrabajo) || new Date(),
      }
      return w
    })

    return parsed
  } catch (err) {
    console.error('Failed to read Excel DB:', err)
    return mockData.map((w) => ({ ...w }))
  }
}

function formatDateDMY(d?: Date | null) {
  if (!d) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function persistEmployeesToExcel() {
  if (!EXCEL_ENABLED) return
  try {
    const header = [
      'id',
      'departamento',
      'ocupacion',
      'estado',
      'firstName',
      'lastName',
      'fullName',
      'employeeNumber',
      'email',
      'fechaLlegadaPlanificada',
      'fechaLlegadaReal',
      'fechaSalidaPlanificada',
      'fechaSalidaReal',
      'inicioPermisoTrabajo',
      'finPermisoTrabajo',
    ]
    const rows: any[] = [header]
    for (const e of employees) {
      rows.push([
        e.id,
        e.departamento,
        e.ocupacion,
        e.estado,
        e.firstName || '',
        e.lastName || '',
        e.fullName || '',
        e.employeeNumber || '',
        e.email || '',
        formatDateDMY(e.fechaLlegadaPlanificada),
        formatDateDMY(e.fechaLlegadaReal),
        formatDateDMY(e.fechaSalidaPlanificada),
        formatDateDMY(e.fechaSalidaReal),
        formatDateDMY(e.inicioPermisoTrabajo),
        formatDateDMY(e.finPermisoTrabajo),
      ])
    }
    const buffer = (xlsx as any).build([{ name: 'data', data: rows }])
    const tmp = `${EXCEL_DB_PATH}.tmp`
    fs.writeFileSync(tmp, buffer)
    fs.renameSync(tmp, EXCEL_DB_PATH)
  } catch (err) {
    console.error('Failed to persist Excel DB:', err)
  }
}

// Initialize store from Excel (fallback to mockData)
let employees: Worker[] = readEmployeesFromExcel()

const ensureDate = (v: any): Date | null => {
  if (v == null) return null
  if (v instanceof Date) return v
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

export function resetStore() {
  employees = mockData.map((w) => ({ ...w }))
  try { persistEmployeesToExcel() } catch (err) { /* ignore */ }
}

export function getAll(filters: EmployeeFilters = {}) {
  const { departamento, ocupacion, estado, search, page = 1, pageSize = 25 } = filters

  let items = employees.slice()

  if (departamento && departamento !== 'TODOS') {
    items = items.filter((i) => i.departamento === departamento)
  }
  if (ocupacion && ocupacion !== 'TODOS') {
    items = items.filter((i) => i.ocupacion === ocupacion)
  }
  if (estado && estado !== 'TODOS') {
    items = items.filter((i) => i.estado === estado)
  }
  if (search && search.trim()) {
    const q = search.toLowerCase()
    items = items.filter((i) =>
      i.ocupacion.toLowerCase().includes(q) ||
      i.departamento.toLowerCase().includes(q) ||
      i.id.toString() === q ||
      (i.fullName && i.fullName.toLowerCase().includes(q)) ||
      (i.firstName && i.firstName.toLowerCase().includes(q)) ||
      (i.lastName && i.lastName.toLowerCase().includes(q))
    )
  }

  const total = items.length
  const start = (Math.max(1, page) - 1) * pageSize
  const end = start + pageSize
  const paged = items.slice(start, end)

  return { data: paged, total }
}

export function getById(id: number) {
  return employees.find((e) => e.id === id) || null
}

export function createEmployee(payload: Partial<Worker>) {
  // uniqueness checks for optional identifiers
  if (payload.employeeNumber) {
    const exists = employees.some((e) => e.employeeNumber && e.employeeNumber === payload.employeeNumber)
    if (exists) throw new Error('employeeNumber already exists')
  }
  if (payload.email) {
    // Try exhaustive search first (normalizing spaces)
    const byEmailExhaustive = findEmployeeByEmailExhaustive(payload.email)
    if (byEmailExhaustive) throw new Error('email already exists')
    // Also standard search as backup
    const exists = employees.some((e) => e.email && String(e.email).trim().toLowerCase() === String(payload.email).trim().toLowerCase())
    if (exists) throw new Error('email already exists')
  }

  const maxId = employees.reduce((m, e) => Math.max(m, e.id), 0)
  const id = maxId + 1
  const nw: Worker = {
    id,
    departamento: payload.departamento || 'Administración',
    ocupacion: payload.ocupacion || 'Empleado/a',
    estado: (payload.estado as any) || 'activo',
    fullName: payload.fullName || `${payload.firstName || 'Empleado'} ${payload.lastName || ''}`.trim(),
    firstName: payload.firstName || undefined,
    lastName: payload.lastName || undefined,
    employeeNumber: payload.employeeNumber || `EMP-${String(id).padStart(6, '0')}`,
    email: payload.email || null,
    fechaLlegadaPlanificada: ensureDate(payload.fechaLlegadaPlanificada) || new Date(),
    fechaLlegadaReal: ensureDate(payload.fechaLlegadaReal) || null,
    fechaSalidaPlanificada: ensureDate(payload.fechaSalidaPlanificada) || new Date(),
    fechaSalidaReal: ensureDate(payload.fechaSalidaReal) || null,
    inicioPermisoTrabajo: ensureDate(payload.inicioPermisoTrabajo) || new Date(),
    finPermisoTrabajo: ensureDate(payload.finPermisoTrabajo) || new Date(),
  }
  employees.unshift(nw)
  try { persistEmployeesToExcel() } catch (err) { console.error('persist error', err) }
  return nw
}

export function updateEmployee(id: number, patch: Partial<Worker>) {
  const idx = employees.findIndex((e) => e.id === id)
  if (idx === -1) return null

  // uniqueness checks (cannot collide with others)
  if (patch.employeeNumber) {
    const clash = employees.find((e) => e.employeeNumber === patch.employeeNumber && e.id !== id)
    if (clash) throw new Error('employeeNumber already exists')
  }
  if (patch.email) {
    // Exhaustive search first
    const searchEmail = String(patch.email).trim().toLowerCase().replace(/\s+/g, ' ')
    const clashExhaustive = employees.find((e) => {
      if (!e.email || e.id === id) return false
      const dbEmail = String(e.email).trim().toLowerCase().replace(/\s+/g, ' ')
      return dbEmail === searchEmail
    })
    if (clashExhaustive) throw new Error('email already exists')
    // Standard search as backup
    const clash = employees.find((e) => e.email && String(e.email).trim().toLowerCase() === String(patch.email).trim().toLowerCase() && e.id !== id)
    if (clash) throw new Error('email already exists')
  }

  const current = employees[idx]
  const updated: Worker = {
    ...current,
    ...patch,
    fullName: patch.fullName ?? (patch.firstName || patch.lastName ? `${patch.firstName ?? current.firstName ?? ''} ${patch.lastName ?? current.lastName ?? ''}`.trim() : current.fullName),
    firstName: patch.firstName ?? current.firstName,
    lastName: patch.lastName ?? current.lastName,
    employeeNumber: patch.employeeNumber ?? current.employeeNumber,
    email: patch.email ?? current.email,
    fechaLlegadaPlanificada: patch.fechaLlegadaPlanificada ? (ensureDate(patch.fechaLlegadaPlanificada) ?? current.fechaLlegadaPlanificada) : current.fechaLlegadaPlanificada,
    fechaLlegadaReal: patch.fechaLlegadaReal ? ensureDate(patch.fechaLlegadaReal) : current.fechaLlegadaReal,
    fechaSalidaPlanificada: patch.fechaSalidaPlanificada ? (ensureDate(patch.fechaSalidaPlanificada) ?? current.fechaSalidaPlanificada) : current.fechaSalidaPlanificada,
    fechaSalidaReal: patch.fechaSalidaReal ? ensureDate(patch.fechaSalidaReal) : current.fechaSalidaReal,
    inicioPermisoTrabajo: patch.inicioPermisoTrabajo ? (ensureDate(patch.inicioPermisoTrabajo) ?? current.inicioPermisoTrabajo) : current.inicioPermisoTrabajo,
    finPermisoTrabajo: patch.finPermisoTrabajo ? (ensureDate(patch.finPermisoTrabajo) ?? current.finPermisoTrabajo) : current.finPermisoTrabajo,
  }
  employees[idx] = updated
  try { persistEmployeesToExcel() } catch (err) { console.error('persist error', err) }
  return updated
}

export function deleteEmployee(id: number) {
  const before = employees.length
  employees = employees.filter((e) => e.id !== id)
  const changed = employees.length < before
  if (changed) {
    try { persistEmployeesToExcel() } catch (err) { console.error('persist error', err) }
  }
  return changed
}

export function bulkUpdate(ids: number[], patch: Partial<Worker>) {
  const results: Worker[] = []
  ids.forEach((id) => {
    const updated = updateEmployee(id, patch)
    if (updated) results.push(updated)
  })
  if (results.length > 0) {
    try { persistEmployeesToExcel() } catch (err) { console.error('persist error', err) }
  }
  return results
}

// Find an existing employee by common identifiers (employeeNumber, email, id, fallback by name+department+occupation)
export function findEmployeeByEmail(email: string | null): Worker | null {
  if (!email) return null
  const em = String(email).trim().toLowerCase()
  return employees.find((e) => e.email && String(e.email).trim().toLowerCase() === em) || null
}

// Exhaustive search: normalize spaces, remove extra whitespace patterns
export function findEmployeeByEmailExhaustive(email: string | null): Worker | null {
  if (!email) return null
  const searchEmail = String(email).trim().toLowerCase().replace(/\s+/g, ' ')
  return employees.find((e) => {
    if (!e.email) return false
    const dbEmail = String(e.email).trim().toLowerCase().replace(/\s+/g, ' ')
    return dbEmail === searchEmail
  }) || null
}

export function findEmployeeByIdentifiers(payload: Partial<Worker>) {
  if (!payload) return null
  // First try ID (most precise)
  if (payload.id != null) {
    const byId = getById(Number(payload.id))
    if (byId) return byId
  }
  // Email search is ALWAYS reliable - prioritize heavily (use exhaustive search)
  if (payload.email) {
    const byEmailExhaustive = findEmployeeByEmailExhaustive(payload.email)
    if (byEmailExhaustive) return byEmailExhaustive
  }
  // Employee number search
  if (payload.employeeNumber) {
    const num = String(payload.employeeNumber).trim()
    const found = employees.find((e) => e.employeeNumber && String(e.employeeNumber).trim() === num)
    if (found) return found
  }
  // Composite search by name + dept + occupation (least precise)
  if (payload.fullName && payload.departamento && payload.ocupacion) {
    const name = String(payload.fullName).trim().toLowerCase()
    const dept = String(payload.departamento).trim().toLowerCase()
    const occ = String(payload.ocupacion).trim().toLowerCase()
    const found = employees.find((e) => String(e.fullName || '').trim().toLowerCase() === name && String(e.departamento).trim().toLowerCase() === dept && String(e.ocupacion).trim().toLowerCase() === occ)
    if (found) return found
  }
  return null
}