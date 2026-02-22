const xlsx = require('node-xlsx')
const fs = require('fs')

// Copia fiel de la generación mock en /lib/data.ts
const DEPARTAMENTOS = ["Cocina", "Limpieza", "Recepción", "Mantenimiento", "Administración", "Animación", "Bar", "Restaurante"]
const OCUPACIONES = [
  "Jefe de Cocina", "Cocinero/a", "Ayudante de Cocina", "Friegaplatos",
  "Gobernante/a", "Camarero/a de pisos", "Mozo de habitaciones",
  "Jefe de Recepción", "Recepcionista", "Botones",
  "Jefe de Mantenimiento", "Técnico de mantenimiento",
  "Director/a", "Contable", "Jefe de RRHH",
  "Jefe de Animación", "Animador/a",
  "Barman", "Camarero/a de barra"
]

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const FIRST_NAMES = ["Ana","Luis","María","Carlos","Lucía","Jorge","Sofía","Miguel","Elena","Diego","Laura","Andrés","Patricia","Raúl","Isabel"]
const LAST_NAMES = ["García","Pérez","Rodríguez","Gómez","Fernández","López","Martínez","Sánchez","Ruiz","Hernández","Jiménez"]

function createWorker(id) {
  const departamento = DEPARTAMENTOS[Math.floor(Math.random() * DEPARTAMENTOS.length)]
  const ocupacion = OCUPACIONES[Math.floor(Math.random() * OCUPACIONES.length)]
  const estado = Math.random() > 0.15 ? 'activo' : 'no activo'

  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  const fullName = `${firstName} ${lastName}`

  const fechaLlegadaPlanificada = randomDate(new Date(2025, 0, 1), new Date(2027, 6, 31))
  const haLlegado = fechaLlegadaPlanificada < new Date()
  const fechaLlegadaReal = haLlegado && Math.random() > 0.1 ? new Date(fechaLlegadaPlanificada.getTime() + (Math.random() - 0.5) * 5 * 24 * 60 * 60 * 1000) : null
  const fechaSalidaPlanificada = new Date(fechaLlegadaPlanificada.getTime() + (60 + Math.random() * 300) * 24 * 60 * 60 * 1000)
  const fechaSalidaReal = estado === 'no activo' && haLlegado && Math.random() > 0.2 ? new Date(fechaSalidaPlanificada.getTime() + (Math.random() - 0.5) * 10 * 24 * 60 * 60 * 1000) : null
  const inicioPermisoTrabajo = new Date(fechaLlegadaPlanificada.getTime() - (15 + Math.random() * 30) * 24 * 60 * 60 * 1000)
  const finPermisoTrabajo = new Date(fechaSalidaPlanificada.getTime() + (365) * 24 * 60 * 60 * 1000)

  // OBLIGATORIO: employeeNumber siempre presente y único (identificador principal)
  const employeeNumber = `EMP-${String(id).padStart(6, '0')}`
  
  // Email: presente 70% del tiempo (no es obligatorio pero recomendado)
  const email = Math.random() > 0.3 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${id}@example.com` : null

  return {
    id,
    departamento,
    ocupacion,
    estado,
    firstName,
    lastName,
    fullName,
    employeeNumber,
    email,
    fechaLlegadaPlanificada,
    fechaLlegadaReal,
    fechaSalidaPlanificada,
    fechaSalidaReal,
    inicioPermisoTrabajo,
    finPermisoTrabajo,
  }
}

const mockData = Array.from({ length: 195 }, (_, i) => createWorker(i + 1))

// Construir filas para Excel
const headers = [
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

const rows = [headers]
for (const r of mockData) {
  rows.push([
    r.id,
    r.departamento,
    r.ocupacion,
    r.estado,
    r.firstName || '',
    r.lastName || '',
    r.fullName || '',
    r.employeeNumber || '',
    r.email || '',
    r.fechaLlegadaPlanificada ? `${String(r.fechaLlegadaPlanificada.getDate()).padStart(2,'0')}/${String(r.fechaLlegadaPlanificada.getMonth()+1).padStart(2,'0')}/${r.fechaLlegadaPlanificada.getFullYear()}` : '',
    r.fechaLlegadaReal ? `${String(r.fechaLlegadaReal.getDate()).padStart(2,'0')}/${String(r.fechaLlegadaReal.getMonth()+1).padStart(2,'0')}/${r.fechaLlegadaReal.getFullYear()}` : '',
    r.fechaSalidaPlanificada ? `${String(r.fechaSalidaPlanificada.getDate()).padStart(2,'0')}/${String(r.fechaSalidaPlanificada.getMonth()+1).padStart(2,'0')}/${r.fechaSalidaPlanificada.getFullYear()}` : '',
    r.fechaSalidaReal ? `${String(r.fechaSalidaReal.getDate()).padStart(2,'0')}/${String(r.fechaSalidaReal.getMonth()+1).padStart(2,'0')}/${r.fechaSalidaReal.getFullYear()}` : '',
    r.inicioPermisoTrabajo ? `${String(r.inicioPermisoTrabajo.getDate()).padStart(2,'0')}/${String(r.inicioPermisoTrabajo.getMonth()+1).padStart(2,'0')}/${r.inicioPermisoTrabajo.getFullYear()}` : '',
    r.finPermisoTrabajo ? `${String(r.finPermisoTrabajo.getDate()).padStart(2,'0')}/${String(r.finPermisoTrabajo.getMonth()+1).padStart(2,'0')}/${r.finPermisoTrabajo.getFullYear()}` : '',
  ])
}

const workbook = [ { name: 'mock-data', data: rows } ]
const buffer = xlsx.build(workbook)

if (!fs.existsSync('data')) fs.mkdirSync('data')
fs.writeFileSync('data/data.xlsx', buffer)
console.log('data/data.xlsx created —', rows.length - 1, 'rows')
