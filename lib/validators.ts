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
    if (!fullNameRaw && !(firstNameRaw && lastNameRaw)) {
      errors.push('El nombre completo es requerido')
    }

    if (!departamento || typeof departamento !== 'string' || departamento.trim().length === 0) {
      errors.push('El departamento es requerido')
    } else if (!masters.departments.includes(departamento)) {
      errors.push(`Departamento no válido: ${departamento}`)
    }

    if (!ocupacion || typeof ocupacion !== 'string' || ocupacion.trim().length === 0) {
      errors.push('La ocupación es requerida')
    }
  }

  if (estadoRaw != null && (typeof estadoRaw !== 'string')) {
    errors.push('El estado debe ser un valor válido')
  }

  // estado normalization
  let estado: string | null = null
  if (estadoRaw != null) {
    const s = String(estadoRaw).trim().toLowerCase()
    if (s === 'activo' || s === 'activo(a)') estado = 'activo'
    else if (s === 'no activo' || s === 'no_activo' || s === 'no-activo' || s === 'inactivo' || s === 'noactivo') estado = 'no activo'
    else estado = 'activo' // default if invalid
  } else {
    estado = 'activo' // default if not provided
  }

  // email validation
  if (emailRaw != null) {
    const e = String(emailRaw).trim()
    if (e.length > 0) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(e)) errors.push('El correo electrónico tiene un formato inválido')
    }
  }

  const llegadaPlanDate = parseFlexibleDate(llegadaPlan)
  const salidaPlanDate = parseFlexibleDate(salidaPlan)
  const llegadaRealDate = parseFlexibleDate(llegadaReal)
  const salidaRealDate = parseFlexibleDate(salidaReal)
  const inicioPermisoDate = parseFlexibleDate(inicioPermiso)
  const finPermisoDate = parseFlexibleDate(finPermiso)

  if (llegadaPlan != null && !llegadaPlanDate) errors.push('La fecha de llegada planificada tiene un formato inválido')
  if (salidaPlan != null && !salidaPlanDate) errors.push('La fecha de salida planificada tiene un formato inválido')
  if (llegadaReal != null && !llegadaRealDate) errors.push('La fecha de llegada real tiene un formato inválido')
  if (salidaReal != null && !salidaRealDate) errors.push('La fecha de salida real tiene un formato inválido')
  if (inicioPermiso != null && !inicioPermisoDate) errors.push('La fecha de inicio de permiso tiene un formato inválido')
  if (finPermiso != null && !finPermisoDate) errors.push('La fecha de fin de permiso tiene un formato inválido')

  if (llegadaPlanDate && salidaPlanDate && salidaPlanDate < llegadaPlanDate) errors.push('La fecha de salida debe ser igual o posterior a la fecha de llegada')
  if (inicioPermisoDate && finPermisoDate && finPermisoDate < inicioPermisoDate) errors.push('La fecha de fin del permiso debe ser igual o posterior a la fecha de inicio')

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

  if (employeeNumberRaw != null) {
    const en = String(employeeNumberRaw).trim()
    if (en.length > 0) normalized.employeeNumber = en
  }
  if (emailRaw != null) {
    const e = String(emailRaw).trim()
    if (e.length > 0) normalized.email = e
  }

  return { valid: errors.length === 0, errors, normalized }
}
