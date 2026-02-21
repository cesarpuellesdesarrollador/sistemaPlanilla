"use client"

import * as React from 'react'
import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import useMasters from '@/hooks/useMasters'
import { toast } from 'sonner'
import { formatDateDMY } from '@/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import * as Select from '@radix-ui/react-select' ;

export default function BulkEdit({ selectedIds, open, onOpenChange, onDone }: { selectedIds: number[]; open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void }) {
  const { masters } = useMasters()
  const [applyDept, setApplyDept] = useState(false)
  const [applyOcc, setApplyOcc] = useState(false)
  const [applyState, setApplyState] = useState(false)
  const [applyLlegada, setApplyLlegada] = useState(false)
  const [applySalida, setApplySalida] = useState(false)

  const [departamento, setDepartamento] = useState<string | null>(masters?.departments?.[0] ?? '')
  const [ocupacion, setOcupacion] = useState<string | null>(masters?.occupations?.[0] ?? '')
  const [estado, setEstado] = useState<string | null>(masters?.states?.[0] ?? 'activo')
  const [fechaLlegada, setFechaLlegada] = useState<string | null>(null)
  const [fechaSalida, setFechaSalida] = useState<string | null>(null)

  React.useEffect(() => {
    if (masters) {
      setDepartamento(masters.departments?.[0] ?? '')
      setOcupacion(masters.occupations?.[0] ?? '')
      setEstado(masters.states?.[0] ?? 'activo')
    }
  }, [masters])

  const selectedCount = selectedIds.length

  const [employeesList, setEmployeesList] = useState<any[] | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [showOnlyChanged, setShowOnlyChanged] = useState(false)
  const MAX_PREVIEW = 200

  React.useEffect(() => {
    let cancelled = false
    const fetchPreview = async () => {
      if (!open) return setEmployeesList(null)
      if (!selectedIds || selectedIds.length === 0) return setEmployeesList([])
      setLoadingPreview(true)
      try {
        const ids = selectedIds.slice(0, MAX_PREVIEW)
        console.log('Fetching preview for IDs:', ids)
        const results = await Promise.all(ids.map((id) => fetch(`/api/planning/employees?id=${id}`).then((r) => r.json()).catch(() => null)))
        console.log('Preview results:', results)
        if (cancelled) return
        const filtered = results.filter(Boolean)
        console.log('Filtered results:', filtered)
        setEmployeesList(filtered)
      } catch (err) {
        console.error('preview fetch error', err)
        setEmployeesList([])
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    }
    fetchPreview()
    return () => { cancelled = true }
  }, [open, selectedIds])

  const previewRows = React.useMemo(() => {
    if (!employeesList) return []
    return employeesList.map((emp) => {
      const before = {
        departamento: emp.departamento || '',
        ocupacion: emp.ocupacion || '',
        estado: emp.estado || '',
        fechaLlegadaPlanificada: formatDateDMY(emp.fechaLlegadaPlanificada || null),
        fechaSalidaPlanificada: formatDateDMY(emp.fechaSalidaPlanificada || null),
      }
      const after: any = { ...before }
      if (applyDept && departamento) after.departamento = departamento
      if (applyOcc && ocupacion) after.ocupacion = ocupacion
      if (applyState && estado) after.estado = estado
      if (applyLlegada && fechaLlegada) after.fechaLlegadaPlanificada = fechaLlegada || ''
      if (applySalida && fechaSalida) after.fechaSalidaPlanificada = fechaSalida || ''
      const keys: Array<keyof typeof before> = ['departamento','ocupacion','estado','fechaLlegadaPlanificada','fechaSalidaPlanificada']
      const changed = keys.some((k) => before[k] !== after[k])
      return { id: emp.id, before, after, changed }
    })
  }, [employeesList, applyDept, applyOcc, applyState, applyLlegada, applySalida, departamento, ocupacion, estado, fechaLlegada, fechaSalida])

  const affectedCount = previewRows.filter((r) => r.changed).length

  const onSubmit = async () => {
    if (selectedCount === 0) return toast.error('No hay empleados seleccionados')
    const patch: any = {}
    if (applyDept && departamento) patch.departamento = departamento
    if (applyOcc && ocupacion) patch.ocupacion = ocupacion
    if (applyState && estado) patch.estado = estado
    if (applyLlegada && fechaLlegada) patch.fechaLlegadaPlanificada = fechaLlegada
    if (applySalida && fechaSalida) patch.fechaSalidaPlanificada = fechaSalida

    if (Object.keys(patch).length === 0) return toast.error('Selecciona al menos un campo para aplicar')

    try {
      const resp = await fetch('/api/planning/employees/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, patch }) })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        return toast.error(json?.error || 'Error al aplicar cambios')
      }
      toast.success(`${json.updatedCount || 0} empleados actualizados`)
      onOpenChange(false)
      onDone && onDone()
    } catch (err) {
      console.error(err)
      toast.error('Error al aplicar cambios')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-lg h-screen max-h-screen flex flex-col">
          <div className="px-6 py-4 flex-shrink-0 flex items-start justify-between border-b bg-white dark:bg-slate-900">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Editar {selectedCount} empleados</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Selecciona los campos a aplicar a los empleados seleccionados.</p>
            </div>
            <button aria-label="Cerrar" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">✕</button>
          </div>
          <div className="px-6 flex-1 overflow-y-auto min-h-0">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input id="apply-dept" type="checkbox" checked={applyDept} onChange={(e) => setApplyDept(e.target.checked)} />
              <label htmlFor="apply-dept" className="text-sm text-gray-300">Departamento</label>
            </div>
            <div>
              <Select.Root value={departamento || ''} onValueChange={(v) => setDepartamento(v)} disabled={!applyDept}>
                <Select.Trigger className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
                  <Select.Value />
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
            </div>

            <div className="flex items-center gap-2">
              <input id="apply-ocup" type="checkbox" checked={applyOcc} onChange={(e) => setApplyOcc(e.target.checked)} />
              <label htmlFor="apply-ocup" className="text-sm text-gray-300">Ocupación</label>
            </div>
            <div>
              <Select.Root value={ocupacion || ''} onValueChange={(v) => setOcupacion(v)} disabled={!applyOcc}>
                <Select.Trigger className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={16} className="text-slate-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      {(masters?.occupations || []).map((o) => (
                        <Select.Item key={o} value={o} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                          <Select.ItemText>{o}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex items-center gap-2">
              <input id="apply-state" type="checkbox" checked={applyState} onChange={(e) => setApplyState(e.target.checked)} />
              <label htmlFor="apply-state" className="text-sm text-gray-300">Estado</label>
            </div>
            <div>
              <Select.Root value={estado || ''} onValueChange={(v) => setEstado(v)} disabled={!applyState}>
                <Select.Trigger className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={16} className="text-slate-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      {(masters?.states || ['activo','no activo']).map((s) => (
                        <Select.Item key={s} value={s} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                          <Select.ItemText>{s}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex items-center gap-2">
              <input id="apply-llegada" type="checkbox" checked={applyLlegada} onChange={(e) => setApplyLlegada(e.target.checked)} />
              <label htmlFor="apply-llegada" className="text-sm text-gray-300">Fecha llegada planificada</label>
            </div>
            <div>
              <input disabled={!applyLlegada} value={fechaLlegada ?? ''} onChange={(e) => setFechaLlegada(e.target.value)} type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" />
            </div>

            <div className="flex items-center gap-2">
              <input id="apply-salida" type="checkbox" checked={applySalida} onChange={(e) => setApplySalida(e.target.checked)} />
              <label htmlFor="apply-salida" className="text-sm text-gray-300">Fecha salida planificada</label>
            </div>
            <div>
              <input disabled={!applySalida} value={fechaSalida ?? ''} onChange={(e) => setFechaSalida(e.target.value)} type="date" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" />
            </div>
          </div>

          <div className="mt-6 border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-300">Vista previa — {selectedCount} seleccionados • {affectedCount} afectados</div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400 inline-flex items-center gap-2"><input type="checkbox" checked={showOnlyChanged} onChange={(e) => setShowOnlyChanged(e.target.checked)} /> Solo cambios</label>
              </div>
            </div>

            {loadingPreview ? (
              <div className="text-sm text-gray-400">Cargando vista previa...</div>
            ) : (previewRows && previewRows.length > 0) ? (
              <div className="overflow-auto max-h-56 border border-gray-800 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-300">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Ocupación</th>
                      <th className="p-2 text-left">Departamento</th>
                      <th className="p-2 text-left">Estado</th>
                      <th className="p-2 text-left">Llegada plan.</th>
                      <th className="p-2 text-left">Salida plan.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.filter(r => !showOnlyChanged || r.changed).map((r) => (
                      <tr key={r.id} className={`border-t border-gray-800 even:bg-gray-950 ${r.changed ? 'bg-emerald-950/10' : ''}`}>
                        <td className="p-2 text-sm">#{r.id}</td>
                        <td className="p-2 text-sm">
                          {r.before.ocupacion !== r.after.ocupacion ? (
                            <div><span className="text-gray-400 line-through">{r.before.ocupacion || '—'}</span> → <span className="text-emerald-300">{r.after.ocupacion}</span></div>
                          ) : (
                            <span className="text-gray-200">{r.before.ocupacion || '—'}</span>
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          {r.before.departamento !== r.after.departamento ? (
                            <div><span className="text-gray-400 line-through">{r.before.departamento || '—'}</span> → <span className="text-emerald-300">{r.after.departamento}</span></div>
                          ) : (
                            <span className="text-gray-200">{r.before.departamento || '—'}</span>
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          {r.before.estado !== r.after.estado ? (
                            <div><span className="text-gray-400 line-through">{r.before.estado || '—'}</span> → <span className="text-emerald-300">{r.after.estado}</span></div>
                          ) : (
                            <span className="text-gray-200">{r.before.estado || '—'}</span>
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          {r.before.fechaLlegadaPlanificada !== r.after.fechaLlegadaPlanificada ? (
                            <div><span className="text-gray-400 line-through">{r.before.fechaLlegadaPlanificada || '—'}</span> → <span className="text-emerald-300">{r.after.fechaLlegadaPlanificada || '—'}</span></div>
                          ) : (
                            <span className="text-gray-200">{r.before.fechaLlegadaPlanificada || '—'}</span>
                          )}
                        </td>
                        <td className="p-2 text-sm">
                          {r.before.fechaSalidaPlanificada !== r.after.fechaSalidaPlanificada ? (
                            <div><span className="text-gray-400 line-through">{r.before.fechaSalidaPlanificada || '—'}</span> → <span className="text-emerald-300">{r.after.fechaSalidaPlanificada || '—'}</span></div>
                          ) : (
                            <span className="text-gray-200">{r.before.fechaSalidaPlanificada || '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No hay empleados para previsualizar.</div>
            )}

            </div> {/* close body scroll area */}
          </div>
          <div className="px-6 py-4 flex-shrink-0 border-t flex justify-end gap-3 bg-white dark:bg-slate-900">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={onSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white">Aplicar a {selectedCount} empleados</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
