"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Worker } from '@/lib/data'
import useMasters from '@/hooks/useMasters'
import { Info, ChevronDown, Check } from 'lucide-react'
import * as Select from '@radix-ui/react-select' ;
import * as Tooltip from '@radix-ui/react-tooltip'

export default function EmployeeForm({ initial, onSubmit, onCancel }: { initial: Partial<Worker>; onSubmit: (payload: Partial<Worker>) => any; onCancel?: () => void }) {
  const [form, setForm] = useState<Partial<Worker>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { masters } = useMasters()

  useEffect(() => {
    const parsed = { ...initial }
    const dateFields = ['fechaLlegadaPlanificada', 'fechaLlegadaReal', 'fechaSalidaPlanificada', 'fechaSalidaReal', 'inicioPermisoTrabajo', 'finPermisoTrabajo'] as const
    dateFields.forEach((field) => {
      if (parsed[field] && !(parsed[field] instanceof Date)) {
        const d = new Date(String(parsed[field]))
        if (!isNaN(d.getTime())) {
          parsed[field] = d
        }
      }
    })
    setForm(parsed)
  }, [initial])

  const setField = (k: keyof Partial<Worker>, v: any) => setForm((s) => ({ ...s, [k]: v }))

  // Mapeo directo de departamentos a ocupaciones
  const getOccupationsForDepartment = (dept: string | undefined): string[] => {
    if (!dept || !masters?.occupations) return masters?.occupations || []
    
    const allOccs = masters?.occupations || []
    const deptMap: Record<string, string[]> = {
      'Cocina': ['Jefe de Cocina', 'Cocinero/a', 'Ayudante de Cocina', 'Friegaplatos'],
      'Limpieza': ['Gobernante/a', 'Camarero/a de pisos', 'Mozo de habitaciones'],
      'Recepción': ['Jefe de Recepción', 'Recepcionista', 'Botones'],
      'Mantenimiento': ['Jefe de Mantenimiento', 'Técnico de mantenimiento'],
      'Administración': ['Director/a', 'Contable', 'Jefe de RRHH'],
      'Animación': ['Jefe de Animación', 'Animador/a'],
      'Bar': ['Barman', 'Camarero/a de barra'],
      'Restaurante': ['Camarero/a de barra', 'Barman', 'Jefe de Cocina', 'Cocinero/a'],
    }
    
    const mapped = deptMap[dept]
    if (mapped) {
      return mapped.filter(occ => allOccs.includes(occ))
    }
    
    return allOccs
  }

  const parseDate = (v: any): Date | null => {
    if (!v) return null
    if (v instanceof Date) return v
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? null : d
  }

  const validate = (state: Partial<Worker>) => {
    const errs: Record<string, string> = {}

    // identity
    if (!state.fullName || String(state.fullName).trim() === '') errs.fullName = 'Nombre completo es requerido'
    if (state.email && String(state.email).trim()) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!re.test(String(state.email))) errs.email = 'Email inválido'
    }

    // required
    if (!state.departamento || String(state.departamento).trim() === '') errs.departamento = 'Departamento es requerido'
    if (!state.ocupacion || String(state.ocupacion).trim() === '') errs.ocupacion = 'Ocupación es requerida'
    if (!state.employeeNumber || String(state.employeeNumber).trim() === '') errs.employeeNumber = 'Código personal de identificación es requerido'

    // llegada / salida
    const a = parseDate(state.fechaLlegadaPlanificada)
    const b = parseDate(state.fechaSalidaPlanificada)
    if (a && b && b < a) errs.range = 'La fecha de salida debe ser igual o posterior a la llegada'

    // permiso de trabajo
    const pStart = parseDate(state.inicioPermisoTrabajo)
    const pEnd = parseDate(state.finPermisoTrabajo)
    if (pStart && pEnd && pEnd < pStart) errs.permisoRange = 'Fecha fin permiso debe ser igual o posterior al inicio'

    return errs
  }

  useEffect(() => {
    setErrors(validate(form))
    // validate when important fields change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fullName, form.email, form.departamento, form.ocupacion, form.employeeNumber, form.fechaLlegadaPlanificada, form.fechaSalidaPlanificada, form.inicioPermisoTrabajo, form.finPermisoTrabajo])

  // Limpiar ocupación solo si el departamento cambió explícitamente y la ocupación no es válida
  useEffect(() => {
    if (form.ocupacion && form.departamento && initial.id) {
      const ocupacionesValidas = getOccupationsForDepartment(form.departamento)
      if (!ocupacionesValidas.includes(form.ocupacion)) {
        setField('ocupacion', '')
      }
    }
  }, [form.departamento, initial.id, masters?.occupations])

  const hasErrors = Object.keys(errors).length > 0

  const dateToInput = (v?: Date | string | null) => {
    if (!v) return ''
    const d = v instanceof Date ? v : new Date(String(v))
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const currentErrors = validate(form)
        if (Object.keys(currentErrors).length > 0) {
          setErrors(currentErrors)
          return
        }

        const payload: any = {
          ...form,
          fechaLlegadaPlanificada: (form.fechaLlegadaPlanificada instanceof Date) ? form.fechaLlegadaPlanificada.toISOString() : form.fechaLlegadaPlanificada,
          fechaLlegadaReal: form.fechaLlegadaReal ? ((form.fechaLlegadaReal instanceof Date) ? form.fechaLlegadaReal.toISOString() : form.fechaLlegadaReal) : null,
          fechaSalidaPlanificada: (form.fechaSalidaPlanificada instanceof Date) ? form.fechaSalidaPlanificada.toISOString() : form.fechaSalidaPlanificada,
          fechaSalidaReal: form.fechaSalidaReal ? ((form.fechaSalidaReal instanceof Date) ? form.fechaSalidaReal.toISOString() : form.fechaSalidaReal) : null,
          inicioPermisoTrabajo: (form.inicioPermisoTrabajo instanceof Date) ? form.inicioPermisoTrabajo.toISOString() : form.inicioPermisoTrabajo,
          finPermisoTrabajo: (form.finPermisoTrabajo instanceof Date) ? form.finPermisoTrabajo.toISOString() : form.finPermisoTrabajo,
        }
        onSubmit(payload)
      }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
        <div className="sm:col-span-2 lg:col-span-3 min-h-[104px]">
        <label className="text-xs text-slate-400 mb-1 block">Nombre completo</label>
        <input placeholder="Ingrese nombre completo" aria-invalid={Boolean(errors.fullName)} aria-describedby={`${errors.fullName ? 'err-fullname' : ''}`} className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.fullName ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100`} value={form.fullName || ''} onChange={(e) => setField('fullName', e.target.value)} />
        {errors.fullName && <p id="err-fullname" className="mt-2 text-xs text-red-400">{errors.fullName}</p>}
      </div>

      <div className="min-h-[104px]">
        <label className="text-xs text-slate-400 mb-1 block">Departamento</label>
        <Select.Root value={String(form.departamento ?? '')} onValueChange={(v) => setField('departamento', v)}>
          <Select.Trigger aria-invalid={Boolean(errors.departamento)} aria-describedby={`${errors.departamento ? 'err-departamento' : ''}`} className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.departamento ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm whitespace-nowrap`}>
            <Select.Value placeholder="Departamento" />
            <Select.Icon>
              <ChevronDown size={16} className="text-slate-400" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
              <Select.Viewport className="p-1">
                {(masters?.departments || []).map((d) => (
                  <Select.Item key={d} value={d} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                    <Select.ItemText>{d}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        {errors.departamento && <p id="err-departamento" className="mt-2 text-xs text-red-400">{errors.departamento}</p>}
      </div>

      <div className="min-h-[104px]">
        <label className="text-xs text-slate-400 mb-1 block">Ocupación</label>
        <Select.Root value={String(form.ocupacion ?? '')} onValueChange={(v) => setField('ocupacion', v)} disabled={!form.departamento}>
          <Select.Trigger aria-invalid={Boolean(errors.ocupacion)} aria-describedby={`${errors.ocupacion ? 'err-ocupacion' : ''}`} className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.ocupacion ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm whitespace-nowrap ${!form.departamento ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Select.Value placeholder={!form.departamento ? "Seleccione departamento primero" : "Ocupación"} />
            <Select.Icon>
              <ChevronDown size={16} className="text-slate-400" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
              <Select.Viewport className="p-1">
                {getOccupationsForDepartment(form.departamento).map((o) => (
                  <Select.Item key={o} value={o} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                    <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                    <Select.ItemText>{o}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        {errors.ocupacion && <p id="err-ocupacion" className="mt-2 text-xs text-red-400">{errors.ocupacion}</p>}
      </div>

      <div className="min-h-[104px]">
        <label className="block text-xs text-slate-400 mb-1">Estado</label>
        <Select.Root value={String(form.estado ?? 'activo')} onValueChange={(v) => setField('estado', v as any)}>
          <Select.Trigger className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
            <Select.Value />
            <Select.Icon>
              <ChevronDown size={16} className="text-slate-400" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
              <Select.Viewport className="p-1">
                <Select.Item value={"activo"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                  <Select.ItemText>Activo</Select.ItemText>
                </Select.Item>
                <Select.Item value={"no activo"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                  <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                  <Select.ItemText>No activo</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <div className="min-h-[104px]">
        <label className="block text-xs text-slate-400 mb-1">Código personal de identificación</label>
        <input placeholder="Ej. EMP-000001" aria-invalid={Boolean(errors.employeeNumber)} aria-describedby={`${errors.employeeNumber ? 'err-empnumber' : ''}`} className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.employeeNumber ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100`} value={form.employeeNumber || ''} onChange={(e) => setField('employeeNumber', e.target.value)} />
        {errors.employeeNumber && <p id="err-empnumber" className="mt-2 text-xs text-red-400">{errors.employeeNumber}</p>}
      </div>

      <div className="min-h-[104px]">
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Email (opcional)</span>
        </label>
        <input aria-invalid={Boolean(errors.email)} aria-describedby={`${errors.email ? 'err-email ' : ''}help-email`} className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.email ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100`} value={form.email || ''} onChange={(e) => setField('email', e.target.value)} />
        {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
      </div>

      <div className="min-h-[104px]">
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Llegada planificada</span>
          <span title="Fecha en la que se espera que comience la relación laboral" className="inline-block"><Info className="h-4 w-4 text-slate-500" aria-hidden="true" /></span>
        </label>
        <input aria-invalid={Boolean(errors.range)} aria-describedby={`${errors.range ? 'err-range ' : ''}help-llegada`} type="date" className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.range ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100`} value={dateToInput(form.fechaLlegadaPlanificada)} onChange={(e) => setField('fechaLlegadaPlanificada', e.target.value ? new Date(e.target.value) : null)} />
        <p id="help-llegada" className="mt-1 text-xs text-slate-500">Formato yyyy-mm-dd. También se aceptan dd/mm/yyyy al importar CSV.</p>
      </div>

      <div className="min-h-[104px]">
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Salida planificada</span>
          <span title="Fecha estimada de salida o fin del contrato/periodo" className="inline-block"><Info className="h-4 w-4 text-slate-500" aria-hidden="true" /></span>
        </label>
        <input aria-invalid={Boolean(errors.range)} aria-describedby={`${errors.range ? 'err-range ' : ''}help-salida`} type="date" className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.range ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100`} value={dateToInput(form.fechaSalidaPlanificada)} onChange={(e) => setField('fechaSalidaPlanificada', e.target.value ? new Date(e.target.value) : null)} />
        <p id="help-salida" className="mt-1 text-xs text-slate-500">Fecha de finalización del periodo planificado.</p>
        {errors.range && <p id="err-range" className="mt-2 text-xs text-red-400">{errors.range}</p>}
      </div>

      <div className="min-h-[104px]">
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Inicio permiso trabajo</span>
          <span title="Fecha de inicio del permiso de trabajo (si aplica)" className="inline-block"><Info className="h-4 w-4 text-slate-500" aria-hidden="true" /></span>
        </label>
        <input aria-invalid={Boolean(errors.permisoRange)} aria-describedby={`${errors.permisoRange ? 'err-permiso ' : ''}help-permiso-start`} type="date" className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.permisoRange ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100`} value={dateToInput(form.inicioPermisoTrabajo)} onChange={(e) => setField('inicioPermisoTrabajo', e.target.value ? new Date(e.target.value) : null)} />
        <p id="help-permiso-start" className="mt-1 text-xs text-slate-500">Si el trabajador necesita permiso de trabajo, indique el inicio.</p>
      </div>

      <div className="min-h-[104px]">
        <label className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Fin permiso trabajo</span>
          <span title="Fecha fin del permiso de trabajo" className="inline-block"><Info className="h-4 w-4 text-slate-500" aria-hidden="true" /></span>
        </label>
        <input aria-invalid={Boolean(errors.permisoRange)} aria-describedby={`${errors.permisoRange ? 'err-permiso ' : ''}help-permiso-end`} type="date" className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border ${errors.permisoRange ? 'border-red-600' : 'border-slate-200'} dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100`} value={dateToInput(form.finPermisoTrabajo)} onChange={(e) => setField('finPermisoTrabajo', e.target.value ? new Date(e.target.value) : null)} />
        <p id="help-permiso-end" className="mt-1 text-xs text-slate-500">Fecha final del permiso (se comprobará coherencia con la fecha inicio).</p>
        {errors.permisoRange && <p id="err-permiso" className="mt-2 text-xs text-red-400">{errors.permisoRange}</p>}
      </div>

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={hasErrors}>Guardar</Button>
        <Button type="button" variant="outline" onClick={() => onCancel && onCancel()}>Cancelar</Button>
      </div>
    </form>
  )
}
