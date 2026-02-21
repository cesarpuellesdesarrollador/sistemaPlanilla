export type Worker = {
  id: number;
  departamento: string;
  ocupacion: string;
  estado: "activo" | "no activo";
  // personal identity
  fullName: string;
  firstName?: string;
  lastName?: string;
  employeeNumber?: string | null; // optional unique identifier
  email?: string | null; // optional unique

  // dates
  fechaLlegadaPlanificada: Date;
  fechaLlegadaReal: Date | null;
  fechaSalidaPlanificada: Date;
  fechaSalidaReal: Date | null;
  inicioPermisoTrabajo: Date;
  finPermisoTrabajo: Date;
};

export const DEPARTAMENTOS = ["Cocina", "Limpieza", "Recepción", "Mantenimiento", "Administración", "Animación", "Bar", "Restaurante"];
export const OCUPACIONES = [
  "Jefe de Cocina", "Cocinero/a", "Ayudante de Cocina", "Friegaplatos",
  "Gobernante/a", "Camarero/a de pisos", "Mozo de habitaciones",
  "Jefe de Recepción", "Recepcionista", "Botones",
  "Jefe de Mantenimiento", "Técnico de mantenimiento",
  "Director/a", "Contable", "Jefe de RRHH",
  "Jefe de Animación", "Animador/a",
  "Barman", "Camarero/a de barra"
];

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const FIRST_NAMES = ["Ana","Luis","María","Carlos","Lucía","Jorge","Sofía","Miguel","Elena","Diego","Laura","Andrés","Patricia","Raúl","Isabel"]
const LAST_NAMES = ["García","Pérez","Rodríguez","Gómez","Fernández","López","Martínez","Sánchez","Ruiz","Hernández","Jiménez"]

const createWorker = (id: number): Worker => {
  const departamento = DEPARTAMENTOS[Math.floor(Math.random() * DEPARTAMENTOS.length)];
  const ocupacion = OCUPACIONES[Math.floor(Math.random() * OCUPACIONES.length)];
  const estado = Math.random() > 0.15 ? "activo" : "no activo";

  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  const fullName = `${firstName} ${lastName}`

  const fechaLlegadaPlanificada = randomDate(new Date(2025, 0, 1), new Date(2027, 6, 31));
  const haLlegado = fechaLlegadaPlanificada < new Date();
  const fechaLlegadaReal = haLlegado && Math.random() > 0.1 ? new Date(fechaLlegadaPlanificada.getTime() + (Math.random() - 0.5) * 5 * 24 * 60 * 60 * 1000) : null;
  const fechaSalidaPlanificada = new Date(fechaLlegadaPlanificada.getTime() + (60 + Math.random() * 300) * 24 * 60 * 60 * 1000);
  const fechaSalidaReal = estado === 'no activo' && haLlegado && Math.random() > 0.2 ? new Date(fechaSalidaPlanificada.getTime() + (Math.random() - 0.5) * 10 * 24 * 60 * 60 * 1000) : null;
  const inicioPermisoTrabajo = new Date(fechaLlegadaPlanificada.getTime() - (15 + Math.random() * 30) * 24 * 60 * 60 * 1000);
  const finPermisoTrabajo = new Date(fechaSalidaPlanificada.getTime() + (365) * 24 * 60 * 60 * 1000);

  // optional employeeNumber/email for subset
  const employeeNumber = Math.random() > 0.6 ? `EMP-${1000 + id}` : null
  const email = Math.random() > 0.7 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com` : null

  return {
    id,
    departamento,
    ocupacion,
    estado,
    fullName,
    firstName,
    lastName,
    employeeNumber,
    email,
    fechaLlegadaPlanificada,
    fechaLlegadaReal,
    fechaSalidaPlanificada,
    fechaSalidaReal,
    inicioPermisoTrabajo,
    finPermisoTrabajo,
  };
};

export const mockData: Worker[] = Array.from({ length: 195 }, (_, i) => createWorker(i + 1));