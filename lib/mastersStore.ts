export const DEFAULT_DEPARTAMENTOS = ["Cocina", "Limpieza", "Recepción", "Mantenimiento", "Administración", "Animación", "Bar", "Restaurante"]
export const DEFAULT_OCUPACIONES = [
  "Jefe de Cocina", "Cocinero/a", "Ayudante de Cocina", "Friegaplatos",
  "Gobernante/a", "Camarero/a de pisos", "Mozo de habitaciones",
  "Jefe de Recepción", "Recepcionista", "Botones",
  "Jefe de Mantenimiento", "Técnico de mantenimiento",
  "Director/a", "Contable", "Jefe de RRHH",
  "Jefe de Animación", "Animador/a",
  "Barman", "Camarero/a de barra"
]
export const DEFAULT_STATES = ["activo", "no activo"]

// In-memory masters (mutable for dev)
let masters = {
  departments: [...DEFAULT_DEPARTAMENTOS],
  occupations: [...DEFAULT_OCUPACIONES],
  states: [...DEFAULT_STATES],
}

export function getMasters() {
  return { ...masters }
}

export function resetMasters() {
  masters = {
    departments: [...DEFAULT_DEPARTAMENTOS],
    occupations: [...DEFAULT_OCUPACIONES],
    states: [...DEFAULT_STATES],
  }
  return getMasters()
}

export function addMaster(type: 'department' | 'occupation' | 'state', value: string) {
  const val = String(value).trim()
  if (!val) return null
  if (type === 'department') {
    if (!masters.departments.includes(val)) masters.departments.push(val)
    return val
  }
  if (type === 'occupation') {
    if (!masters.occupations.includes(val)) masters.occupations.push(val)
    return val
  }
  if (type === 'state') {
    if (!masters.states.includes(val)) masters.states.push(val)
    return val
  }
  return null
}

export function updateMaster(type: 'department' | 'occupation' | 'state', oldValue: string, newValue: string) {
  const newVal = String(newValue).trim()
  if (!newVal) return null
  if (type === 'department') {
    const idx = masters.departments.indexOf(oldValue)
    if (idx === -1) return null
    masters.departments[idx] = newVal
    return newVal
  }
  if (type === 'occupation') {
    const idx = masters.occupations.indexOf(oldValue)
    if (idx === -1) return null
    masters.occupations[idx] = newVal
    return newVal
  }
  if (type === 'state') {
    const idx = masters.states.indexOf(oldValue)
    if (idx === -1) return null
    masters.states[idx] = newVal
    return newVal
  }
  return null
}

export function deleteMaster(type: 'department' | 'occupation' | 'state', value: string) {
  if (type === 'department') {
    masters.departments = masters.departments.filter((d) => d !== value)
    return true
  }
  if (type === 'occupation') {
    masters.occupations = masters.occupations.filter((o) => o !== value)
    return true
  }
  if (type === 'state') {
    masters.states = masters.states.filter((s) => s !== value)
    return true
  }
  return false
}
