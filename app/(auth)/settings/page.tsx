"use client"

import * as React from 'react'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { PlusCircle, Edit, Trash, RefreshCw, Check, X, ChevronDown } from 'lucide-react'
import * as Select from '@radix-ui/react-select' ;
import { toast } from 'sonner'

import useMasters from '@/hooks/useMasters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfirmationDialog from '@/components/confirmation-dialog'

export default function SettingsPage() {
  const { masters, loading, refresh, add, update, remove } = useMasters()

  const [adding, setAdding] = useState<{ type: string; value: string } | null>(null)
  const [editing, setEditing] = useState<{ type: string; oldValue: string; value: string } | null>(null)
  const [deleting, setDeleting] = useState<{ type: string; value: string } | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  // responsive: switch modal -> drawer on large screens
  const [isLarge, setIsLarge] = useState(false)
  React.useEffect(() => {
    const onResize = () => setIsLarge(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // employees using the master value (shown in drawer/modal)
  const [employeesUsing, setEmployeesUsing] = useState<any[] | null>(null)
  const [loadingEmployeesUsing, setLoadingEmployeesUsing] = useState(false)
  const [reassignTarget, setReassignTarget] = useState<string | null>(null)

  React.useEffect(() => {
    const fetchUsers = async () => {
      if (!editing) {
        setEmployeesUsing(null)
        setReassignTarget(null)
        return
      }
      setLoadingEmployeesUsing(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('pageSize', '10000')
        if (editing.type === 'department') params.set('departamento', editing.oldValue)
        if (editing.type === 'occupation') params.set('ocupacion', editing.oldValue)
        if (editing.type === 'state') params.set('estado', editing.oldValue)
        const resp = await fetch(`/api/planning/employees?${params.toString()}`)
        const json = await resp.json()
        setEmployeesUsing(json.data || [])

        // default reassign target to first available different master
        const options = editing.type === 'department' ? (masters?.departments || []) : editing.type === 'occupation' ? (masters?.occupations || []) : (masters?.states || [])
        const first = options.find((v) => v !== editing.oldValue) || null
        setReassignTarget(first)
      } catch (err) {
        console.error(err)
        setEmployeesUsing([])
      } finally {
        setLoadingEmployeesUsing(false)
      }
    }
    fetchUsers()
  }, [editing, masters])

  const employeesHref = editing
    ? (editing.type === 'department'
      ? `/employees?departamento=${encodeURIComponent(editing.oldValue)}`
      : editing.type === 'occupation'
        ? `/employees?ocupacion=${encodeURIComponent(editing.oldValue)}`
        : `/employees?estado=${encodeURIComponent(editing.oldValue)}`)
    : '#';

  if (!masters && loading) return <div className="p-6 text-gray-400">Cargando datos maestros...</div>

  const onStartAdd = (type: 'department' | 'occupation' | 'state') => setAdding({ type, value: '' })
  const onCancelAdd = () => setAdding(null)
  const onConfirmAdd = async () => {
    if (!adding || !adding.value.trim()) return toast.error('Ingrese un valor válido')
    const type = adding.type as any
    const val = adding.value.trim()
    const res = await add(type, val)
    if ((res && (res.error || res.success === false)) || !res) {
      toast.error('No se pudo agregar')
      return
    }
    toast.success('Agregado')
    setAdding(null)
  }

  const onStartEdit = (type: 'department' | 'occupation' | 'state', oldValue: string) => setEditing({ type, oldValue, value: oldValue })
  const onCancelEdit = () => setEditing(null)
  const onConfirmEdit = async () => {
    if (!editing || !editing.value.trim()) return toast.error('Valor inválido')
    const type = editing.type as any
    const res = await update(type, editing.oldValue, editing.value.trim())
    if (!res || res.error) {
      toast.error('No se pudo actualizar')
      return
    }
    toast.success('Actualizado')
    setEditing(null)
  }

  const onRequestDelete = (type: 'department' | 'occupation' | 'state', value: string) => setDeleting({ type, value })
  const onCancelDelete = () => setDeleting(null)
  const onConfirmDelete = async () => {
    if (!deleting) return
    const { type, value } = deleting
    const res = await remove(type as any, value)
    if (!res || res.error) {
      // if server returns in-use, show helpful message
      if (res && res.error === 'in-use') {
        toast.error(`No se puede eliminar: ${res.count} empleados usan este valor (usar reasignación).`)
      } else {
        toast.error('No se pudo eliminar')
      }
      return
    }
    toast.success('Eliminado')
    setDeleting(null)
  }

  const onReassign = async (removeOld = false) => {
    if (!editing) return
    if (!reassignTarget) return toast.error('Selecciona un valor de destino')
    if (reassignTarget === editing.oldValue) return toast.error('Selecciona un valor distinto')

    try {
      const resp = await fetch('/api/planning/masters/reassign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: editing.type, from: editing.oldValue, to: reassignTarget, removeOld }) })
      const j = await resp.json()
      if (!resp.ok) {
        return toast.error(j?.error || 'Error al reasignar')
      }
      toast.success(`Reasignados: ${j.updatedCount || 0}`)
      await refresh()
      // refresh the list of employees using this value
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('pageSize', '10000')
      if (editing.type === 'department') params.set('departamento', editing.oldValue)
      if (editing.type === 'occupation') params.set('ocupacion', editing.oldValue)
      if (editing.type === 'state') params.set('estado', editing.oldValue)
      const r2 = await fetch(`/api/planning/employees?${params.toString()}`)
      const j2 = await r2.json()
      setEmployeesUsing(j2.data || [])
      if (removeOld) setEditing(null)
    } catch (err) {
      console.error(err)
      toast.error('Error al reasignar')
    }
  }

  const onResetDefaults = async () => {
    try {
      const resp = await fetch('/api/planning/masters?reset=1', { method: 'PATCH' })
      const j = await resp.json().catch(() => ({}))
      if (!resp.ok) return toast.error('No se pudo restaurar valores por defecto')
      await refresh()
      toast.success('Valores por defecto restaurados')
    } catch (err) {
      console.error(err)
      toast.error('Error al restaurar')
    } finally {
      setResetOpen(false)
    }
  }

  return (
    <div className="w-full text-gray-50 font-sans">
      <div className="max-w-6xl mx-auto py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Configuración — Datos maestros</h1>
            <p className="text-gray-400 mt-1">Administra Departamentos, Ocupaciones y Estados usados en la planificación.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-gray-900 border-gray-700 hover:bg-gray-800 text-white" onClick={() => setResetOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Restaurar por defecto
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Departments */}
          <div className="card p-4 bg-gray-900 border border-gray-800 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Departamentos</h3>
              <div className="flex items-center gap-2">
                {!adding || adding.type !== 'department' ? (
                  <Button size="sm" onClick={() => onStartAdd('department')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input autoFocus placeholder="Nuevo departamento" value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} className="bg-gray-800" />
                    <Button size="sm" onClick={onConfirmAdd}><Check /></Button>
                    <Button size="sm" variant="outline" onClick={onCancelAdd}><X /></Button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-auto max-h-72 border border-gray-800 rounded">
              <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow>
                    <TableHead className="text-gray-300">Nombre</TableHead>
                    <TableHead className="text-gray-300 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(masters?.departments || []).map((d) => {
                    const count = masters?.usage?.departments?.[d] ?? 0
                    const disabled = count > 0
                    return (
                      <TableRow key={d} className="even:bg-gray-950/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-200">{d}</div>
                            {count > 0 && <div className="text-xs text-gray-300 bg-gray-800 px-2 py-0.5 rounded">En uso: {count}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => onStartEdit('department', d)}><Edit /></Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => onRequestDelete('department', d)} disabled={disabled} title={disabled ? 'No se puede eliminar: en uso por empleados' : 'Eliminar'}><Trash /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Occupations */}
          <div className="card p-4 bg-gray-900 border border-gray-800 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Ocupaciones</h3>
              <div>
                {!adding || adding.type !== 'occupation' ? (
                  <Button size="sm" onClick={() => onStartAdd('occupation')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input autoFocus placeholder="Nueva ocupación" value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} className="bg-gray-800" />
                    <Button size="sm" onClick={onConfirmAdd}><Check /></Button>
                    <Button size="sm" variant="outline" onClick={onCancelAdd}><X /></Button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-auto max-h-72 border border-gray-800 rounded">
              <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow>
                    <TableHead className="text-gray-300">Nombre</TableHead>
                    <TableHead className="text-gray-300 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(masters?.occupations || []).map((o) => {
                    const count = masters?.usage?.occupations?.[o] ?? 0
                    const disabled = count > 0
                    return (
                      <TableRow key={o} className="even:bg-gray-950/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-200">{o}</div>
                            {count > 0 && <div className="text-xs text-gray-300 bg-gray-800 px-2 py-0.5 rounded">En uso: {count}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => onStartEdit('occupation', o)}><Edit /></Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => onRequestDelete('occupation', o)} disabled={disabled} title={disabled ? 'No se puede eliminar: en uso por empleados' : 'Eliminar'}><Trash /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* States */}
          <div className="card p-4 bg-gray-900 border border-gray-800 rounded">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Estados</h3>
              <div>
                {!adding || adding.type !== 'state' ? (
                  <Button size="sm" onClick={() => onStartAdd('state')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input autoFocus placeholder="Nuevo estado" value={adding.value} onChange={(e) => setAdding({ ...adding, value: e.target.value })} className="bg-gray-800" />
                    <Button size="sm" onClick={onConfirmAdd}><Check /></Button>
                    <Button size="sm" variant="outline" onClick={onCancelAdd}><X /></Button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-auto max-h-72 border border-gray-800 rounded">
              <Table>
                <TableHeader className="bg-gray-900">
                  <TableRow>
                    <TableHead className="text-gray-300">Nombre</TableHead>
                    <TableHead className="text-gray-300 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(masters?.states || []).map((s) => {
                    const count = masters?.usage?.states?.[s] ?? 0
                    const disableDelete = (masters?.states || []).length <= 1 || count > 0
                    return (
                      <TableRow key={s} className="even:bg-gray-950/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-200">{s}</div>
                            {count > 0 && <div className="text-xs text-gray-300 bg-gray-800 px-2 py-0.5 rounded">En uso: {count}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => onStartEdit('state', s)}><Edit /></Button>
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => onRequestDelete('state', s)} disabled={disableDelete} title={disableDelete ? (count > 0 ? 'No se puede eliminar: en uso por empleados' : 'Debe quedar al menos un estado') : 'Eliminar'}>
                                <Trash />
                              </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Edit modal (single) */}
        <Dialog.Root open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null) }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            {isLarge ? (
              /* Drawer on large screens */
              <Dialog.Content className="fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 rounded-l-lg shadow-lg p-6 overflow-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{`Editar ${editing?.type === 'department' ? 'Departamento' : editing?.type === 'occupation' ? 'Ocupación' : 'Estado'}`}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Modifica el valor maestro</p>
                  </div>
                  <button aria-label="Cerrar" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">✕</button>
                </div>

                <div className="mb-4">
                  <Input autoFocus value={editing?.value ?? ''} onChange={(e) => setEditing(editing ? { ...editing, value: e.target.value } : null)} className="bg-gray-800" />
                </div>
              <div className="mb-4 border-t border-gray-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-gray-300">Empleados que usan "{editing?.oldValue}" <span className="text-xs text-gray-400">({employeesUsing?.length ?? 0})</span></h4>
                  {employeesUsing && employeesUsing.length > 0 && (
                    <div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={employeesHref}>
                          Ver en Empleados
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {loadingEmployeesUsing ? (
                  <div className="text-sm text-gray-400">Cargando...</div>
                ) : employeesUsing && employeesUsing.length ? (
                  <div className="max-h-48 overflow-auto border border-gray-800 rounded p-2 bg-gray-950/30">
                    {employeesUsing.slice(0, 200).map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-800/40 last:border-b-0">
                        <div className="text-gray-200">#{u.id} — {u.ocupacion} / {u.departamento}</div>
                        <div className="text-xs text-gray-400">Estado: {u.estado}</div>
                      </div>
                    ))}
                    {employeesUsing.length > 200 && <div className="text-xs text-gray-400 mt-2">Mostrando 200 de {employeesUsing.length}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Ningún empleado usa este valor.</div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Reasignar a</label>
                <Select.Root value={reassignTarget ?? ''} onValueChange={(v) => setReassignTarget(v === '' ? null : v)}>
                  <Select.Trigger className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                      <Select.Viewport className="p-1">
                        <Select.Item value={""} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                          <Select.ItemText>-- seleccionar --</Select.ItemText>
                        </Select.Item>
                        {(editing?.type === 'department' ? (masters?.departments || []) : editing?.type === 'occupation' ? (masters?.occupations || []) : (masters?.states || [])).filter((v) => v !== editing?.oldValue).map((opt) => (
                          <Select.Item key={opt} value={opt} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                            <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                            <Select.ItemText>{opt}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>              {employeesUsing && employeesUsing.length > 0 && (
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="text-sm text-gray-400">Reasignar {employeesUsing.length} empleados antes de eliminar</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onReassign(false)} disabled={!reassignTarget || reassignTarget === editing?.oldValue}>Reasignar</Button>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onReassign(true)} disabled={!reassignTarget || reassignTarget === editing?.oldValue}>Reasignar y eliminar</Button>
                  </div>
                </div>
              )}
                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                  <Button onClick={onConfirmEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white">Guardar</Button>
                </div>
              </Dialog.Content>
            ) : (
              /* Centered modal on small screens */
              <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{`Editar ${editing?.type === 'department' ? 'Departamento' : editing?.type === 'occupation' ? 'Ocupación' : 'Estado'}`}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Modifica el valor maestro</p>
                  </div>
                  <button aria-label="Cerrar" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">✕</button>
                </div>

                <div className="mb-4">
                  <Input autoFocus value={editing?.value ?? ''} onChange={(e) => setEditing(editing ? { ...editing, value: e.target.value } : null)} className="bg-gray-800" />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                  <Button onClick={onConfirmEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white">Guardar</Button>
                </div>
              </Dialog.Content>
            )}
          </Dialog.Portal>
        </Dialog.Root>

        {/* Confirmation dialogs */}
        <ConfirmationDialog
          open={!!deleting}
          title="Eliminar elemento"
          description={`Se eliminará "${deleting?.value}". Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />

        <ConfirmationDialog
          open={resetOpen}
          title="Restaurar valores por defecto"
          description="Se restaurarán los valores por defecto para Departamentos, Ocupaciones y Estados. Esto sobrescribirá los cambios actuales en los datos maestros."
          confirmLabel="Restaurar"
          cancelLabel="Cancelar"
          onConfirm={onResetDefaults}
          onCancel={() => setResetOpen(false)}
        />
      </div>
    </div>
  )
}
