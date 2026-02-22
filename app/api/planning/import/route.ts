import { NextResponse } from 'next/server'
import { validateEmployeePayload } from '@/lib/validators'
import { createEmployee, findEmployeeByIdentifiers, updateEmployee } from '@/lib/employeesStore'
import xlsx from 'node-xlsx'

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function mapHeaderToKey(h: string | null) {
  if (!h) return null
  const n = stripAccents(String(h))
  if (n.includes('depart')) return 'departamento'
  if (n.includes('ocup')) return 'ocupacion'
  if (n.includes('estado')) return 'estado'
  if (n.includes('llegadaplan') || n.includes('llegadaplanificada') || n.includes('fechallegadaplan')) return 'fechaLlegadaPlanificada'
  if (n.includes('llegadareal') || n.includes('fechallegadareal')) return 'fechaLlegadaReal'
  if (n.includes('salidaplan') || n.includes('salidaplanificada') || n.includes('fechasalidaplan')) return 'fechaSalidaPlanificada'
  if (n.includes('salidareal') || n.includes('fechasalidareal')) return 'fechaSalidaReal'
  if (n.includes('iniciopermiso') || n.includes('fechainiciopermiso') || n.includes('fechainiciopermisotrabajo')) return 'inicioPermisoTrabajo'
  if (n.includes('finpermiso') || n.includes('fechafinpermiso') || n.includes('fechafinpermisotrabajo')) return 'finPermisoTrabajo'

  // name / identity fields
  if (n.includes('nombre') || n.includes('fullname') || n.includes('full') || n.includes('name')) return 'fullName'
  if (n.includes('firstname') || n.includes('first')) return 'firstName'
  if (n.includes('lastname') || n.includes('last')) return 'lastName'
  if (n.includes('empleado') && n.includes('num')) return 'employeeNumber'
  if (n.includes('employee') && (n.includes('num') || n.includes('id') || n.includes('number') || n.includes('code') || n.includes('legajo'))) return 'employeeNumber'
  if (n.includes('legajo') || n.includes('nempleado')) return 'employeeNumber'
  if (n.includes('email') || n.includes('correo')) return 'email'
  return null
}

function parseCSV(text: string) {
  text = String(text || '').replace(/^\uFEFF/, '')
  const rows: string[][] = []
  // detect delimiter from first non-empty line (support semicolon-delimited CSVs)
  const firstLine = (text.split(/\r?\n/).find(Boolean) || '')
  const commaCount = (firstLine.match(/,/g) || []).length
  const semiCount = (firstLine.match(/;/g) || []).length
  const delimiter = semiCount > commaCount ? ';' : ','
  let cur = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const nxt = text[i + 1]
    if (ch === '"') {
      if (inQuotes && nxt === '"') {
        cur += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (ch === delimiter && !inQuotes) {
      row.push(cur)
      cur = ''
      continue
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (cur !== '' || row.length > 0) {
        row.push(cur)
        rows.push(row)
        row = []
        cur = ''
      }
      if (ch === '\r' && nxt === '\n') i++
      continue
    }
    cur += ch
  }
  if (cur !== '' || row.length > 0) {
    row.push(cur)
    rows.push(row)
  }
  const header = rows.shift() || []
  return { header: header.map((h) => String(h).trim()), rows }
}

function buildErrorCSV(failed: Array<{ original: any[]; errors: string[] }>, header: string[]) {
  const headers = [...header, 'Errors']
  const lines = [headers.join(',')]
  failed.forEach((f) => {
    const row = f.original.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')
    const err = `"${f.errors.join('; ').replace(/"/g, '""')}"`
    lines.push(`${row},${err}`)
  })
  return `\uFEFF${lines.join('\n')}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    // Mode 1: client already sent an array of rows -> validate & apply according to mode (create-only|merge|overwrite|reject-duplicates)
    if (Array.isArray(body.rows)) {
      const rows = body.rows as any[]
      const mode: 'create-only' | 'merge' | 'overwrite' | 'reject-duplicates' = body.mode || 'merge'
      const errors: Array<{ row: number; errors: string[]; original?: any }> = []
      let createdCount = 0
      let updatedCount = 0

      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx]
        // partial validation first
        const partial = validateEmployeePayload(r, { partial: true })
        if (!partial.valid) {
          errors.push({ row: idx + 1, errors: partial.errors, original: r })
          continue
        }

        const existing = findEmployeeByIdentifiers(r as any)
        try {
          if (existing) {
            if (mode === 'reject-duplicates') {
              errors.push({ row: idx + 1, errors: ['Duplicate - rejected'], original: r })
            } else if (mode === 'create-only') {
              // skip existing
            } else if (mode === 'merge') {
              const patch: any = { ...(partial.normalized || r) }
              const updated = updateEmployee(existing.id, patch)
              if (updated) updatedCount += 1
              else errors.push({ row: idx + 1, errors: ['Update failed during merge'], original: r })
            } else if (mode === 'overwrite') {
              const full = validateEmployeePayload(r, { partial: false })
              if (!full.valid) {
                errors.push({ row: idx + 1, errors: full.errors, original: r })
              } else {
                const updated = updateEmployee(existing.id, full.normalized || r)
                if (updated) updatedCount += 1
                else errors.push({ row: idx + 1, errors: ['Overwrite failed'], original: r })
              }
            }
          } else {
            // create new -> requires full validation
            const full = validateEmployeePayload(r, { partial: false })
            if (!full.valid) {
              errors.push({ row: idx + 1, errors: full.errors, original: r })
            } else {
              createEmployee(full.normalized || r)
              createdCount += 1
            }
          }
        } catch (err: any) {
          errors.push({ row: idx + 1, errors: [err?.message || 'unknown error'], original: r })
        }
      }

      const imported = createdCount + updatedCount
      const failed = errors.length
      const errorsCsv = failed ? buildErrorCSV(errors.map(f => ({ original: Object.values(f.original || {}), errors: f.errors })), Object.keys(rows[0] || {})) : null
      return NextResponse.json({ success: true, imported, failed, errorsCsv, created: createdCount, updated: updatedCount })
    }

    // Mode 2: file upload as base64 content (preview or import)
    const { filename, content, preview } = body
    if (!filename || !content) return NextResponse.json({ error: 'filename and content required' }, { status: 400 })

    const lower = String(filename).toLowerCase()
    let parsed: { header: string[]; rows: any[][] } | null = null

    if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
      const text = Buffer.from(content, 'base64').toString('utf8')
      parsed = parseCSV(text)
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      // parse XLSX buffer
      const buf = Buffer.from(content, 'base64')
      const sheets = xlsx.parse(buf)
      if (!sheets || sheets.length === 0) return NextResponse.json({ error: 'No sheets found' }, { status: 400 })
      const sheet = sheets[0]
      const allRows = sheet.data || []
      const header = (allRows[0] || []).map((h: any) => String(h || '').trim())
      const rows = (allRows.slice(1) as any[][])
      parsed = { header, rows }
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // build preview / or import
    const header = parsed.header
    const mappedRows = parsed.rows.map((r, idx) => {
      const obj: any = {}
      header.forEach((h, i) => {
        const key = mapHeaderToKey(h)
        const val = r[i]
        if (!key) return
        const strVal = val == null ? '' : String(val).trim()
        obj[key] = strVal === '' ? null : strVal
      })
      const validation = validateEmployeePayload(obj)
      // detect match against existing store
      const match = findEmployeeByIdentifiers(obj as any)
      return {
        row: idx + 1,
        raw: r,
        payload: obj,
        valid: validation.valid,
        errors: validation.errors,
        normalized: validation.normalized,
        match: match ? { id: match.id, employeeNumber: match.employeeNumber || null, email: match.email || null } : null,
      }
    })

    if (preview) {
      return NextResponse.json({ success: true, previewRows: mappedRows.slice(0, 500), totalRows: mappedRows.length })
    }

    // proceed to import all valid rows (support `mode` for file imports)
    const mode: 'create-only' | 'merge' | 'overwrite' | 'reject-duplicates' = (body.mode as any) || 'merge'
    const errors: Array<{ row: number; errors: string[]; original?: any }> = []
    let createdCount = 0
    let updatedCount = 0

    for (let i = 0; i < mappedRows.length; i++) {
      const r = mappedRows[i]
      if (!r.valid) {
        errors.push({ row: r.row, errors: r.errors, original: r.raw })
        continue
      }
      const payload = r.normalized || r.payload
      const existing = findEmployeeByIdentifiers(payload as any)

      try {
        if (existing) {
          if (mode === 'reject-duplicates') {
            errors.push({ row: r.row, errors: ['Duplicate - rejected'], original: r.raw })
          } else if (mode === 'create-only') {
            // skip existing
          } else if (mode === 'merge') {
            const partial = validateEmployeePayload(payload, { partial: true })
            const patch: any = { ...(partial.normalized || payload) }
            const updated = updateEmployee(existing.id, patch)
            if (updated) updatedCount += 1
            else errors.push({ row: r.row, errors: ['Update failed during merge'], original: r.raw })
          } else if (mode === 'overwrite') {
            const full = validateEmployeePayload(payload, { partial: false })
            if (!full.valid) {
              errors.push({ row: r.row, errors: full.errors, original: r.raw })
            } else {
              const updated = updateEmployee(existing.id, full.normalized || payload)
              if (updated) updatedCount += 1
              else errors.push({ row: r.row, errors: ['Overwrite failed'], original: r.raw })
            }
          }
        } else {
          const full = validateEmployeePayload(payload, { partial: false })
          if (!full.valid) {
            errors.push({ row: r.row, errors: full.errors, original: r.raw })
          } else {
            createEmployee(full.normalized || payload)
            createdCount += 1
          }
        }
      } catch (err: any) {
        errors.push({ row: r.row, errors: [err?.message || 'unknown error'], original: r.raw })
      }
    }

    const imported = createdCount + updatedCount
    const failed = errors.length
    const errorsCsv = failed ? buildErrorCSV(errors.map(f => ({ original: f.original ? Object.values(f.original) : [], errors: f.errors })), header) : null
    return NextResponse.json({ success: true, imported, failed, errorsCsv, created: createdCount, updated: updatedCount })
  } catch (err) {
    console.error('import error', err)
    return NextResponse.json({ error: 'Invalid payload or parse error' }, { status: 400 })
  }
}
