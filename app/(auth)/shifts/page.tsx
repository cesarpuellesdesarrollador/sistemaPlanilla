"use client"

import * as React from 'react'
import { useEffect, useState } from 'react'
import { startOfMonth, endOfMonth, addMonths, subMonths, differenceInCalendarDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react'
import * as Select from '@radix-ui/react-select' ;
import { Button } from '@/components/ui/button'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { AdvancedFilters, FilterConfig } from '@/components/filters/AdvancedFilters'
import { Timeline } from '@/components/calendar/timeline'
import EmployeeForm from '@/components/employee/EmployeeForm'
import useMasters from '@/hooks/useMasters'
export default function ShiftsPage() {
  const [current, setCurrent] = useState<Date>(startOfMonth(new Date()))
  const [entries, setEntries] = useState<any[]>([])
  const [allEntries, setAllEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string,string>>({ departamento: 'TODOS', ocupacion: 'TODOS', estado: 'TODOS' })

  // Pagination (UX default: 20 items/page; options: 10/20/50/100)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)

  const daysInMonth = differenceInCalendarDays(endOfMonth(current), startOfMonth(current)) + 1

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null)

  const fetchShifts = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('pageSize', '10000')
    const resp = await fetch(`/api/planning/shifts?${params.toString()}`)
    const json = await resp.json()
    const raw = (json.data || [])
    const mapped = raw.map((w: any) => ({
      id: w.id,
      label: `#${w.id} — ${w.ocupacion}`,
      departamento: w.departamento,
      estado: w.estado,
      start: w.fechaLlegadaPlanificada,
      end: w.fechaSalidaPlanificada,
    }))
    setAllEntries(mapped)
    // apply filters to derive entries
    applyFilters(mapped)
    setLoading(false)
  }

  useEffect(() => { fetchShifts() }, [])

  const { masters } = useMasters()

  // apply filters and pagination client-side
  const applyFilters = (src: any[]) => {
    let items = src.slice()
    if (filters.departamento && filters.departamento !== 'TODOS') {
      items = items.filter((e) => e.departamento === filters.departamento)
    }
    if (filters.ocupacion && filters.ocupacion !== 'TODOS') {
      items = items.filter((e) => e.label.toLowerCase().includes(filters.ocupacion.toLowerCase()))
    }
    if (filters.estado && filters.estado !== 'TODOS') {
      items = items.filter((e) => e.estado === filters.estado)
    }
    const tot = items.length
    const start = (Math.max(1, page) - 1) * pageSize
    const end = start + pageSize
    setEntries(items.slice(start, end))
    setTotal(tot)
  }

  const filterConfigs: FilterConfig[] = [
    { key: 'departamento', label: 'Departamento', options: [{ value: 'TODOS', label: 'Todos' }, ...(masters?.departments || []).map((d) => ({ value: d, label: d }))] },
    { key: 'ocupacion', label: 'Ocupación', options: [{ value: 'TODOS', label: 'Todos' }, ...(masters?.occupations || []).map((o) => ({ value: o, label: o }))] },
    { key: 'estado', label: 'Estado', options: [{ value: 'TODOS', label: 'Todos' }, ...(masters?.states || ['activo', 'no activo']).map((s:any) => ({ value: s, label: s }))] },
  ]

  // Pagination helpers

  useEffect(() => {
    applyFilters(allEntries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, pageSize, allEntries])
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0
  const getVisiblePageNumbers = (tp: number, cur: number): (number | string)[] => {
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1)
    const pages: (number | string)[] = []
    const left = Math.max(2, cur - 1)
    const right = Math.min(tp - 1, cur + 1)
    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < tp - 1) pages.push('...')
    pages.push(tp)
    return pages
  }
  const visiblePages = getVisiblePageNumbers(totalPages, page)

  return (
    <div className="w-full text-gray-50 font-sans">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-gray-800 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Calendario / Gantt</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">Vista temporal de la planificación — usa filtros para ajustar la vista.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrent((c) => subMonths(c, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs sm:text-sm text-gray-300 font-medium px-2 sm:px-3 whitespace-nowrap">{format(current, 'MMMM yyyy', { locale: es })}</div>
            <Button variant="ghost" size="sm" onClick={() => setCurrent((c) => addMonths(c, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <AdvancedFilters
            filters={filters}
            filterConfigs={filterConfigs}
            onFilterChange={(k, v) => {
              setFilters((s) => ({ ...s, [k]: v }))
              setPage(1)
            }}
            onClearFilters={() => {
              setFilters({ departamento: 'TODOS', ocupacion: 'TODOS', estado: 'TODOS' })
              setPage(1)
            }}
            activeFiltersCount={Object.values(filters).filter((v) => v && v !== 'TODOS').length}
            resultCount={total || entries.length}
            showFilters={true}
            onToggleFilters={() => { /* noop */ }}
          />
        </div>

        <div className="overflow-x-auto">
          <Timeline
            entries={entries}
            startDate={startOfMonth(current)}
            days={daysInMonth}
            dayWidth={28}
            onRowClick={(entry) => {
              setSelectedEntry(entry)
              setDialogOpen(true)
            }}
          />
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 py-4">
          <div className="text-xs sm:text-sm text-gray-400 text-center">
            {loading ? 'Cargando datos...' : total > 0 ? `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} de ${total}` : 'Sin resultados'}
          </div>

          {!loading && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Page size selector — label per UX best practices: "Filas por página" */}
            <label className="sr-only" htmlFor="shifts-page-size">Filas por página</label>
            <Select.Root value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <Select.Trigger id="shifts-page-size" className="flex items-center justify-between px-3 py-2 text-sm bg-gray-900 border border-gray-800 rounded text-gray-200" aria-label="Filas por página">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown size={16} className="text-gray-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50">
                  <Select.Viewport className="p-1">
                    <Select.Item value={"10"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>10</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"20"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>20</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"50"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>50</Select.ItemText>
                    </Select.Item>
                    <Select.Item value={"100"} className="relative flex items-center px-8 py-2 text-sm text-slate-900 dark:text-slate-200 rounded cursor-pointer select-none outline-none hover:bg-slate-100 dark:hover:bg-slate-600">
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center"><Check size={14} /></Select.ItemIndicator>
                      <Select.ItemText>100</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {/* Numeric page buttons (with ellipsis) */}
            <nav aria-label="Paginación" className="flex items-center gap-1 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="bg-gray-900 border-gray-700 hover:bg-gray-800"
                aria-label="Página anterior"
              >
                ‹
              </Button>

              {visiblePages.length === 0 ? null : visiblePages.map((p, idx) => (
                typeof p === 'string' ? (
                  <span key={`e-${idx}`} className="px-2 text-gray-500">{p}</span>
                ) : (
                  <Button
                    key={p}
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(Number(p))}
                    className={
                      `px-2 ${p === page ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-900 text-gray-200 border-gray-700'} h-8`
                    }
                    aria-current={p === page ? 'page' : undefined}
                    aria-label={`Ir a la página ${p}`}
                  >
                    {p}
                  </Button>
                )
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages || p + 1, p + 1))}
                disabled={totalPages === 0 || page >= totalPages}
                className="bg-gray-900 border-gray-700 hover:bg-gray-800"
                aria-label="Página siguiente"
              >
                ›
              </Button>
            </nav>
          </div>
          )}
        </div>

        {/* Edit modal for selected timeline row */}
        <Dialog.Root open={dialogOpen} onOpenChange={(o) => setDialogOpen(o)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Editar trabajador — rango</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Ajusta las fechas planificadas y guarda los cambios.</p>
                </div>
                <button aria-label="Cerrar" onClick={() => setDialogOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">✕</button>
              </div>

              {selectedEntry && (
                <EmployeeForm
                  initial={{
                    departamento: selectedEntry.departamento,
                    ocupacion: selectedEntry.label?.split('—')?.[1]?.trim() || '',
                    estado: selectedEntry.estado,
                    fechaLlegadaPlanificada: selectedEntry.start || undefined,
                    fechaSalidaPlanificada: selectedEntry.end || undefined,
                  }}
                  onCancel={() => setDialogOpen(false)}
                  onSubmit={async (payload) => {
                    try {
                      // call PUT to update employee by id
                      const body = { id: selectedEntry.id, ...payload }
                      const resp = await fetch('/api/planning/employees', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                      if (!resp.ok) {
                        const j = await resp.json().catch(() => ({}))
                        toast.error(j.error || 'Error al guardar')
                        return
                      }
                      toast.success('Rango actualizado correctamente')
                      setDialogOpen(false)
                      fetchShifts()
                    } catch (err) {
                      console.error(err)
                      toast.error('Error al guardar')
                    }
                  }}
                />
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

      </div>
    </div>
  )
}
