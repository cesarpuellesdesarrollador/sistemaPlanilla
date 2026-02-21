import { getMasters } from './mastersStore'

export type ValidationResult = {
  valid: boolean
  errors: string[]
  normalized?: Record<string, any>
}

function parseFlexibleDate(input: any): Date | null {
  if (input == null) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input
  const s = String(input).trim()
  if (!s) return null
  // ISO-like
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/)
  if (m) {
    const dd = m[1].padStart(2, '0')
    const mm = m[2].padStart(2, '0')
    const yyyy = m[3]
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`)
    return isNaN(d.getTime()) ? null : d
  }
  // fallback to Date parse
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function toISODate(date: Date | null): string | null {
  if (!date) return null
  return date.toISOString().slice(0, 10)
}

export function validateEmployeePayload(payload: any, options?: { partial?: boolean }): ValidationResult {
  const errors: string[] = []
  const partial = options?.partial ?? false

  const departamento = payload?.departamento
  const ocupacion = payload?.ocupacion
  const estadoRaw = payload?.estado
  const llegadaPlan = payload?.fechaLlegadaPlanificada
  const salidaPlan = payload?.fechaSalidaPlanificada
  const llegadaReal = payload?.fechaLlegadaReal
  const salidaReal = payload?.fechaSalidaReal
  const inicioPermiso = payload?.inicioPermisoTrabajo
  const finPermiso = payload?.finPermisoTrabajo

  // identity fields
  const fullNameRaw = payload?.fullName || payload?.name || payload?.nombre
  const firstNameRaw = payload?.firstName
  const lastNameRaw = payload?.lastName
  const employeeNumberRaw = payload?.employeeNumber
  const emailRaw = payload?.email

  const masters = getMasters()

  if (!partial) {
    if (!departamento || typeof departamento !== 'string' || departamento.trim().length === 0) {
      errors.push('Departamento es requerido')
    } else if (!masters.departments.includes(departamento)) {
      errors.push(`Departamento desconocido: ${departamento}`)
    }

    if (!ocupacion || typeof ocupacion !== 'string' || ocupacion.trim().length === 0) {
      errors.push('Ocupación es requerida')
    }

    if (!estadoRaw || typeof estadoRaw !== 'string') {
      errors.push('Estado es requerido')
    }

    if (!llegadaPlan) {
      errors.push('Fecha llegada planificada es requerida')
    }

    if (!salidaPlan) {
      errors.push('Fecha salida planificada es requerida')
    }

    // identity requirement: require at least fullName or structured names
    if (!fullNameRaw && !(firstNameRaw && lastNameRaw)) {
      errors.push('Nombre completo (fullName) o firstName+lastName son requeridos')
    }
  }

  // estado normalization
  let estado: string | null = null
  if (estadoRaw != null) {
    const s = String(estadoRaw).trim().toLowerCase()
    if (s === 'activo' || s === 'activo(a)') estado = 'activo'
    else if (s === 'no activo' || s === 'no_activo' || s === 'no-activo' || s === 'inactivo' || s === 'noactivo') estado = 'no activo'
    else errors.push(`Estado no válido: ${estadoRaw}`)
  }

  // employeeNumber/email basic checks
  if (employeeNumberRaw != null) {
    if (String(employeeNumberRaw).trim().length === 0) errors.push('employeeNumber inválido')
  }
  if (emailRaw != null) {
    const e = String(emailRaw).trim()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(e)) errors.push('Email no tiene un formato válido')
  }

  const llegadaPlanDate = parseFlexibleDate(llegadaPlan)
  const salidaPlanDate = parseFlexibleDate(salidaPlan)
  const llegadaRealDate = parseFlexibleDate(llegadaReal)
  const salidaRealDate = parseFlexibleDate(salidaReal)
  const inicioPermisoDate = parseFlexibleDate(inicioPermiso)
  const finPermisoDate = parseFlexibleDate(finPermiso)

  if (llegadaPlan != null && !llegadaPlanDate) errors.push('Fecha llegada planificada inválida')
  if (salidaPlan != null && !salidaPlanDate) errors.push('Fecha salida planificada inválida')
  if (llegadaReal != null && !llegadaRealDate) errors.push('Fecha llegada real inválida')
  if (salidaReal != null && !salidaRealDate) errors.push('Fecha salida real inválida')
  if (inicioPermiso != null && !inicioPermisoDate) errors.push('Fecha inicio permiso inválida')
  if (finPermiso != null && !finPermisoDate) errors.push('Fecha fin permiso inválida')

  if (llegadaPlanDate && salidaPlanDate && salidaPlanDate < llegadaPlanDate) errors.push('Fecha salida planificada es anterior a llegada planificada')
  if (inicioPermisoDate && finPermisoDate && finPermisoDate < inicioPermisoDate) errors.push('Fecha fin permiso es anterior a fecha inicio permiso')

  // optional coherence checks
  if (llegadaRealDate && llegadaPlanDate && llegadaRealDate < llegadaPlanDate) {
    // arrival real before planned arrival is suspicious but allow (warning)
    errors.push('Fecha llegada real anterior a la llegada planificada')
  }
  if (salidaRealDate && salidaPlanDate && salidaRealDate < salidaPlanDate) {
    errors.push('Fecha salida real anterior a la salida planificada')
  }

  // Normalize names: prefer fullName; derive first/last if needed
  const normalized: Record<string, any> = {}
  if (departamento) normalized.departamento = String(departamento)
  if (ocupacion) normalized.ocupacion = String(ocupacion)
  if (estado) normalized.estado = estado
  if (llegadaPlanDate) normalized.fechaLlegadaPlanificada = toISODate(llegadaPlanDate)
  if (salidaPlanDate) normalized.fechaSalidaPlanificada = toISODate(salidaPlanDate)
  if (llegadaRealDate) normalized.fechaLlegadaReal = toISODate(llegadaRealDate)
  if (salidaRealDate) normalized.fechaSalidaReal = toISODate(salidaRealDate)
  if (inicioPermisoDate) normalized.inicioPermisoTrabajo = toISODate(inicioPermisoDate)
  if (finPermisoDate) normalized.finPermisoTrabajo = toISODate(finPermisoDate)

  // names
  const fullName = fullNameRaw ? String(fullNameRaw).trim() : null
  const firstName = firstNameRaw ? String(firstNameRaw).trim() : null
  const lastName = lastNameRaw ? String(lastNameRaw).trim() : null
  if (fullName) {
    normalized.fullName = fullName
    if (!firstName || !lastName) {
      const parts = fullName.split(/\s+/)
      normalized.firstName = parts.shift() || ''
      normalized.lastName = parts.join(' ') || ''
    } else {
      normalized.firstName = firstName
      normalized.lastName = lastName
    }
  } else if (firstName && lastName) {
    normalized.firstName = firstName
    normalized.lastName = lastName
    normalized.fullName = `${firstName} ${lastName}`
  }

  if (employeeNumberRaw != null) normalized.employeeNumber = String(employeeNumberRaw).trim()
  if (emailRaw != null) normalized.email = String(emailRaw).trim()

  return { valid: errors.length === 0, errors, normalized }
}
